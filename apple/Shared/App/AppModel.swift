// App-wide state: active exam, persisted progress, the daily mock meter,
// theme, navigation and the running study session. Pure rules live in Core.
import Foundation
import SwiftUI

enum Destination: String, CaseIterable, Identifiable, Hashable {
    case home, practice, cards, answers, about
    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Home"
        case .practice: return "Practice"
        case .cards: return "Flashcards"
        case .answers: return "Answer Key"
        case .about: return "About"
        }
    }

    var glyph: String {
        switch self {
        case .home: return Glyph.home
        case .practice: return Glyph.practice
        case .cards: return Glyph.cards
        case .answers: return Glyph.answers
        case .about: return Glyph.about
        }
    }
}

enum StudySession: Hashable, Identifiable {
    case quiz(QuizScope)
    case cards(DeckScope)

    var id: String {
        switch self {
        case .quiz(.mock): return "quiz-mock"
        case .quiz(.section(let n)): return "quiz-\(n)"
        case .cards(.all): return "cards-all"
        case .cards(.bookmarks): return "cards-bookmarks"
        case .cards(.section(let n)): return "cards-\(n)"
        }
    }
}

enum PaywallReason: String, Identifiable {
    case section, mock, banner, results, answers
    var id: String { rawValue }

    var message: String? {
        switch self {
        case .section: return "This section is part of Pro. Free covers the first \(Gating.freeSectionCount) sections of each exam."
        case .mock: return "You\u{2019}ve used today\u{2019}s free mock exam. Pro removes the limit."
        default: return nil
        }
    }
}

enum ThemeMode: String, CaseIterable, Identifiable {
    case dark, light
    var id: String { rawValue }
    var label: String { self == .dark ? "Black" : "Paper" }
}

@MainActor
final class AppModel: ObservableObject {
    // Same keys as the Expo app's AsyncStorage, for consistency.
    private enum Key {
        static let exam = "pstar:exam:v1"
        static let mocks = "pstar:mocks:v1"
        static let disclaimer = "pstar:disclaimer:v1"
        static let theme = "pstar:theme:v1"
        static func progress(_ id: ExamID) -> String {
            id == .pstar ? "pstar:progress:v1" : "pstar:progress:v1:\(id.rawValue)"
        }
    }

    let exams: [ExamID: Exam]
    private let defaults: UserDefaults

    @Published var examID: ExamID { didSet { defaults.set(examID.rawValue, forKey: Key.exam) } }
    @Published private(set) var progressByExam: [ExamID: StudyProgress] = [:]
    @Published private(set) var mockLog: [ExamID: [String]] = [:]
    @Published var disclaimerAccepted: Bool
    @Published var theme: ThemeMode { didSet { defaults.set(theme.rawValue, forKey: Key.theme) } }

    @Published var destination: Destination? = .home
    @Published var session: StudySession?
    @Published var paywall: PaywallReason?
    @Published var showDisclaimer = false
    @Published var answerKeyFilter: AnswerKeyFilter = .all

    init(bundle: Bundle = .main, defaults: UserDefaults = .standard) {
        self.defaults = defaults
        var loaded: [ExamID: Exam] = [:]
        for id in ExamID.allCases {
            // The JSON ships in the bundle; a failure here is a build error.
            loaded[id] = try! Catalog.load(id, bundle: bundle)
        }
        exams = loaded
        examID = ExamID(rawValue: defaults.string(forKey: Key.exam) ?? "") ?? .pstar
        disclaimerAccepted = defaults.string(forKey: Key.disclaimer) == "1"
        theme = ThemeMode(rawValue: defaults.string(forKey: Key.theme) ?? "") ?? .dark
        for id in ExamID.allCases {
            if let data = defaults.data(forKey: Key.progress(id)),
               let p = try? JSONDecoder().decode(StudyProgress.self, from: data) {
                progressByExam[id] = p
            }
        }
        if let data = defaults.data(forKey: Key.mocks),
           let log = try? JSONDecoder().decode([String: [String]].self, from: data) {
            for (k, v) in log { if let id = ExamID(rawValue: k) { mockLog[id] = v } }
        }
        #if DEBUG
        applyQAArguments()
        #endif
    }

    var exam: Exam { exams[examID]! }
    var meta: ExamMeta { exam.meta }
    var progress: StudyProgress { progressByExam[examID] ?? StudyProgress() }

    // MARK: Progress mutations (active exam)

    private func mutate(_ change: (inout StudyProgress) -> Void) {
        var p = progress
        change(&p)
        progressByExam[examID] = p
        if let data = try? JSONEncoder().encode(p) { defaults.set(data, forKey: Key.progress(examID)) }
    }

    func recordAnswer(_ id: String, correct: Bool) { mutate { $0.recordAnswer(id: id, correct: correct) } }
    func recordExam(pct: Int) { mutate { $0.recordExam(pct: pct) } }
    func toggleBookmark(_ id: String) { mutate { $0.toggleBookmark(id) } }
    func setKnown(_ id: String, _ known: Bool) { mutate { $0.setKnown(id, known) } }
    func resetProgress() { mutate { $0 = StudyProgress() } }

    func acceptDisclaimer() {
        disclaimerAccepted = true
        defaults.set("1", forKey: Key.disclaimer)
    }

    // MARK: Gating (bound to the active exam)

    func mocksLeft(isPro: Bool, now: Date = Date()) -> Int {
        Gating.mocksRemaining(isPro: isPro, startedDays: mockLog[examID] ?? [], today: Gating.dayKey(now))
    }

    func canMock(isPro: Bool) -> Bool { mocksLeft(isPro: isPro) > 0 }

    func canSection(_ id: Int, isPro: Bool) -> Bool {
        Gating.canAccessSection(isPro: isPro, sections: exam.sections, sectionID: id)
    }

    private func noteMockStart() {
        let next = Gating.logMockStart(mockLog[examID] ?? [], today: Gating.dayKey(Date()))
        mockLog[examID] = next
        var out: [String: [String]] = [:]
        for (k, v) in mockLog { out[k.rawValue] = v }
        if let data = try? JSONEncoder().encode(out) { defaults.set(data, forKey: Key.mocks) }
    }

    /// Central guard: every session starts here, so a locked section or a used
    /// daily mock can never open, whatever triggered it.
    func start(_ s: StudySession, isPro: Bool) {
        switch s {
        case .quiz(let scope):
            if !Gating.quizAllowed(isPro: isPro, sections: exam.sections, scope: scope) {
                paywall = .section
                return
            }
            if scope.isMock {
                guard canMock(isPro: isPro) else {
                    paywall = .mock
                    return
                }
                // A started mock exam uses up the free tier's daily mock (no-op for Pro).
                if !isPro { noteMockStart() }
            }
        case .cards(let scope):
            if !Gating.deckAllowed(isPro: isPro, sections: exam.sections, scope: scope) {
                paywall = .section
                return
            }
        }
        session = s
    }

    func endSession() { session = nil }

    func showAnswers(_ filter: AnswerKeyFilter) {
        answerKeyFilter = filter
        session = nil
        destination = .answers
    }

    #if DEBUG
    /// QA / screenshots only (Debug builds): `-QAReset YES` wipes state,
    /// `-QASeed YES` fills plausible progress, `-QAExam roca`, `-QADestination answers`.
    private func applyQAArguments() {
        let d = UserDefaults.standard
        if d.bool(forKey: "QAReset") {
            progressByExam = [:]
            mockLog = [:]
        }
        if let e = d.string(forKey: "QAExam"), let id = ExamID(rawValue: e) { examID = id }
        if let dest = d.string(forKey: "QADestination"), let v = Destination(rawValue: dest) { destination = v }
        if d.bool(forKey: "QAAccept") { disclaimerAccepted = true }
        if d.bool(forKey: "QASeed") {
            for id in ExamID.allCases {
                guard let exam = exams[id] else { continue }
                var p = StudyProgress()
                var g = SystemRandomNumberGenerator()
                for q in exam.questions.shuffled(using: &g).prefix(exam.questions.count * 3 / 5) {
                    p.recordAnswer(id: q.id, correct: Int.random(in: 0..<10) < 8)
                }
                for q in exam.questions.prefix(6) { p.toggleBookmark(q.id) }
                for q in exam.questions.prefix(18) { p.setKnown(q.id, true) }
                p.recordExam(pct: id == .pstar ? 92 : 84)
                p.recordExam(pct: id == .pstar ? 86 : 76)
                progressByExam[id] = p
            }
        }
    }
    #endif
}
