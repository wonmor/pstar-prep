// Quiz state machine and scoring, mirroring QuizScreen.tsx.
//
// Practice (a single section): an answer is locked in and revealed at once,
// with instant feedback and the reference; it is recorded immediately.
// Mock exam: answers stay editable, Back/Next move freely, nothing is revealed
// until Submit; every question is recorded on submit, unanswered counts wrong.
import Foundation

/// The option order shown to the user, with a map back to original indices so
/// the correct answer is tracked when options are shuffled.
public struct ShuffledOptions: Hashable, Sendable {
    public let labels: [String]
    public let correctIndex: Int
    public let order: [Int]

    public init<R: RandomNumberGenerator>(_ q: Question, using rng: inout R) {
        let order = Array(q.options.indices).shuffled(using: &rng)
        self.order = order
        self.labels = order.map { q.options[$0] }
        self.correctIndex = order.firstIndex(of: q.answer - 1) ?? 0
    }
}

public struct QuizItem: Hashable, Sendable {
    public let question: Question
    public let options: ShuffledOptions
}

public enum OptionState: Equatable, Sendable {
    case idle, selected, correct, wrong
}

public struct QuizResult: Hashable, Sendable {
    public let correct: Int
    public let total: Int
    public let isMock: Bool
    public let passPct: Int
    public let wrongIDs: [String]

    public var pct: Int { Scoring.percent(correct: correct, total: total) }
    public var passed: Bool { pct >= passPct }
}

public enum Scoring {
    /// Math.round((correct / total) * 100), as in the Expo app.
    public static func percent(correct: Int, total: Int) -> Int {
        guard total > 0 else { return 0 }
        return Int((Double(correct) / Double(total) * 100).rounded(.toNearestOrAwayFromZero))
    }
}

public struct QuizSession: Sendable {
    public let scope: QuizScope
    public let passPct: Int
    public let items: [QuizItem]
    /// Selected shuffled-option index per question (-1 = unanswered).
    public private(set) var picks: [Int]
    public private(set) var index = 0
    /// Practice only: whether the current question has been revealed.
    public private(set) var revealed = false

    public var isMock: Bool { scope.isMock }
    public var total: Int { items.count }
    public var current: QuizItem { items[index] }
    public var picked: Int { picks[index] }
    public var isLast: Bool { index == total - 1 }
    public var answeredCount: Int { picks.filter { $0 >= 0 }.count }
    public var showFeedback: Bool { !isMock && revealed }
    public var isCurrentRight: Bool { picked == current.options.correctIndex }
    public var progress: Double {
        guard total > 0 else { return 0 }
        return Double(index + (revealed || isMock ? 1 : 0)) / Double(total)
    }

    public init<R: RandomNumberGenerator>(exam: Exam, scope: QuizScope, using rng: inout R) {
        let qs = exam.buildQuiz(scope, using: &rng)
        self.init(scope: scope, passPct: exam.passPct, items: qs.map { QuizItem(question: $0, options: ShuffledOptions($0, using: &rng)) })
    }

    public init(exam: Exam, scope: QuizScope) {
        var g = SystemRandomNumberGenerator()
        self.init(exam: exam, scope: scope, using: &g)
    }

    public init(scope: QuizScope, passPct: Int, items: [QuizItem]) {
        self.scope = scope
        self.passPct = passPct
        self.items = items
        self.picks = Array(repeating: -1, count: items.count)
    }

    public enum ChooseOutcome: Equatable, Sendable {
        case ignored
        case selected // mock: answer stored, may change
        case revealed(questionID: String, correct: Bool) // practice: record this answer
    }

    /// Pick option `i` (0-based) for the current question.
    @discardableResult
    public mutating func choose(_ i: Int) -> ChooseOutcome {
        guard items.indices.contains(index), current.options.labels.indices.contains(i) else { return .ignored }
        if isMock {
            picks[index] = i
            return .selected
        }
        if revealed { return .ignored } // locked after reveal in practice
        picks[index] = i
        revealed = true
        return .revealed(questionID: current.question.id, correct: i == current.options.correctIndex)
    }

    /// Practice: Next is only possible after reveal. Mock: always.
    public var canAdvance: Bool { isMock || revealed }

    /// Moves to the next question. Returns false when already on the last one
    /// (the caller then finishes).
    @discardableResult
    public mutating func next() -> Bool {
        guard canAdvance, index < total - 1 else { return false }
        index += 1
        revealed = false
        return true
    }

    /// Mock exams only: step back to change an answer.
    public mutating func back() {
        guard isMock, index > 0 else { return }
        index -= 1
    }

    public mutating func jump(to i: Int) {
        guard isMock, items.indices.contains(i) else { return }
        index = i
    }

    public func optionState(_ i: Int) -> OptionState {
        if isMock || !revealed { return picked == i ? .selected : .idle }
        if i == current.options.correctIndex { return .correct }
        if i == picked { return .wrong }
        return .idle
    }

    /// Score the session. For mock exams `answers` lists every question so the
    /// caller can record them on submit (practice already recorded on reveal).
    public func finish() -> (result: QuizResult, answers: [(id: String, correct: Bool)]) {
        var correct = 0
        var wrong: [String] = []
        var answers: [(id: String, correct: Bool)] = []
        for (i, item) in items.enumerated() {
            let ok = picks[i] == item.options.correctIndex
            if ok { correct += 1 } else { wrong.append(item.question.id) }
            answers.append((item.question.id, ok))
        }
        let result = QuizResult(correct: correct, total: total, isMock: isMock, passPct: passPct, wrongIDs: wrong)
        return (result, isMock ? answers : [])
    }
}
