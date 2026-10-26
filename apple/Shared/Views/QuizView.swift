import SwiftUI

/// Actions the menu bar (macOS) and keyboard drive in the active study session.
struct StudyActions {
    var answer: ((Int) -> Void)?
    var next: (() -> Void)?
    var previous: (() -> Void)?
    var bookmark: (() -> Void)?
    var flip: (() -> Void)?
    var again: (() -> Void)?
    var gotIt: (() -> Void)?
    var close: (() -> Void)?
}

struct StudyActionsKey: FocusedValueKey {
    typealias Value = StudyActions
}

extension FocusedValues {
    var studyActions: StudyActions? {
        get { self[StudyActionsKey.self] }
        set { self[StudyActionsKey.self] = newValue }
    }
}

@MainActor
final class QuizController: ObservableObject {
    @Published var session: QuizSession
    @Published var result: QuizResult?

    init(exam: Exam, scope: QuizScope) {
        session = QuizSession(exam: exam, scope: scope)
    }
}

struct QuizView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.palette) private var c
    @StateObject private var ctl: QuizController
    let scope: QuizScope

    init(exam: Exam, scope: QuizScope) {
        self.scope = scope
        _ctl = StateObject(wrappedValue: QuizController(exam: exam, scope: scope))
    }

    var body: some View {
        Group {
            if let result = ctl.result {
                ResultsView(result: result)
            } else {
                question
            }
        }
        .background(c.paper)
        #if DEBUG
        .onAppear(perform: applyQA)
        #endif
    }

    #if DEBUG
    /// Screenshots only: `-QAAnswer wrong|right` answers the first question,
    /// `-QAFinish YES` answers everything (about 9 in 10 right) and submits.
    private func applyQA() {
        let d = UserDefaults.standard
        if d.bool(forKey: "QAFinish") {
            for i in 0..<ctl.session.total {
                let right = ctl.session.current.options.correctIndex
                choose(i % 10 == 3 ? (right + 1) % 4 : right)
                if i < ctl.session.total - 1 { ctl.session.next() }
            }
            finish()
        } else if let a = d.string(forKey: "QAAnswer") {
            let right = ctl.session.current.options.correctIndex
            choose(a == "right" ? right : (right + 2) % 4)
        }
    }
    #endif

    // MARK: Actions

    private func choose(_ i: Int) {
        if case .revealed(let id, let ok) = ctl.session.choose(i) {
            model.recordAnswer(id, correct: ok)
        }
    }

    private func next() {
        if ctl.session.isMock {
            if ctl.session.isLast { finish() } else { ctl.session.next() }
            return
        }
        guard ctl.session.revealed else { return }
        if !ctl.session.next() { finish() }
    }

    private func finish() {
        let (result, answers) = ctl.session.finish()
        // Mock exams record every question on submit; practice recorded on reveal.
        for a in answers { model.recordAnswer(a.id, correct: a.correct) }
        if result.isMock { model.recordExam(pct: result.pct) }
        ctl.result = result
    }

    private var actions: StudyActions {
        StudyActions(
            answer: { choose($0) },
            // Return never submits a mock exam; Submit is a deliberate click.
            next: (ctl.session.isMock && ctl.session.isLast) ? nil : { next() },
            previous: ctl.session.isMock ? { ctl.session.back() } : nil,
            bookmark: { model.toggleBookmark(ctl.session.current.question.id) },
            close: { model.endSession() })
    }

    // MARK: Question

    private var question: some View {
        let s = ctl.session
        let item = s.current
        let bookmarked = model.progress.isBookmarked(item.question.id)
        return VStack(spacing: 0) {
            FlowBar(
                closeLabel: s.isMock ? "Quit mock exam" : "Quit practice",
                progress: s.progress,
                onClose: { model.endSession() },
                trailing: {
                    Button { model.toggleBookmark(item.question.id) } label: {
                        Image(systemName: bookmarked ? Glyph.star : Glyph.starOpen)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(bookmarked ? c.red : c.ink)
                            .frame(width: Target.min, height: Target.min)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help(bookmarked ? "Remove bookmark" : "Bookmark question")
                    .accessibilityLabel(bookmarked ? "Remove bookmark" : "Bookmark question")
                })

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .firstTextBaseline, spacing: Space.md) {
                        Kicker(s.isMock ? "Mock exam" : model.exam.sectionName(item.question.section))
                            .lineLimit(1)
                        Spacer()
                        (Text(String(format: "%02d", s.index + 1)).foregroundColor(s.isMock ? c.red : c.blue)
                            + Text("/\(s.total)").foregroundColor(c.inkSoft))
                            .font(.jost(.black, 28, relativeTo: .title))
                            .accessibilityLabel("Question \(s.index + 1) of \(s.total)")
                    }
                    Text(item.question.question)
                        .font(.jost(.bold, 24, relativeTo: .title2))
                        .foregroundStyle(c.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, Space.md)
                        .accessibilityAddTraits(.isHeader)
                    VStack(spacing: Space.sm) {
                        ForEach(Array(item.options.labels.enumerated()), id: \.offset) { i, label in
                            OptionRow(index: i, text: label, state: s.optionState(i), disabled: s.showFeedback) { choose(i) }
                        }
                    }
                    .padding(.top, Space.xl)

                    if s.showFeedback { feedback(s) }
                }
                .frame(maxWidth: 760, alignment: .leading)
                .padding(Space.xl)
                .frame(maxWidth: .infinity)
            }
            #if os(macOS)
            footer(s)
            #endif
        }
        #if os(visionOS)
        .ornament(attachmentAnchor: .scene(.bottom), contentAlignment: .top) {
            footer(s)
                .frame(width: 560)
                .padding(Space.md)
                .glassBackgroundEffect()
        }
        #endif
        .background(keyboardLetters)
        .focusedSceneValue(\.studyActions, actions)
        .animation(.easeOut(duration: 0.15), value: s.index)
    }

    private func feedback(_ s: QuizSession) -> some View {
        let ok = s.isCurrentRight
        return HStack(alignment: .top, spacing: Space.md) {
            Rectangle().fill(ok ? c.blue : c.red).frame(width: RuleWeight.heavy)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: Space.sm) {
                    Image(systemName: ok ? Glyph.check : Glyph.close).font(.system(size: 24, weight: .bold))
                    Text(ok ? "CORRECT" : "NOT QUITE").font(.jost(.black, 22)).tracking(1)
                }
                .foregroundStyle(ok ? c.blue : c.red)
                if !s.current.question.reference.isEmpty {
                    (Text("REFERENCE ").font(.jost(.bold, 14)).foregroundColor(c.ink)
                        + Text(s.current.question.reference).font(.jost(.regular, 14)).foregroundColor(c.inkSoft))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.vertical, Space.xs)
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(.top, Space.xl)
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func footer(_ s: QuizSession) -> some View {
        Group {
            if s.isMock {
                HStack(spacing: Space.md) {
                    Button { ctl.session.back() } label: { BauhausLabel(title: "Back") }
                        .buttonStyle(BauhausButtonStyle(variant: .ghost))
                        .disabled(s.index == 0)
                    Button { next() } label: {
                        BauhausLabel(title: s.isLast ? "Submit \(s.answeredCount)/\(s.total)" : "Next", trailing: Glyph.arrow)
                    }
                    .buttonStyle(BauhausButtonStyle(variant: s.isLast ? .red : .primary))
                }
            } else {
                Button { next() } label: {
                    BauhausLabel(title: s.revealed ? (s.isLast ? "See results" : "Next question") : "Select an answer",
                                 trailing: s.revealed ? Glyph.arrow : nil)
                }
                .buttonStyle(BauhausButtonStyle(variant: s.revealed ? .primary : .ghost))
                .disabled(!s.revealed)
            }
        }
        #if os(macOS)
        .frame(maxWidth: 760)
        .padding(Space.lg)
        .frame(maxWidth: .infinity)
        .overlay(alignment: .top) { HRule() }
        .background(c.paper)
        #endif
    }

    /// A-D answer keys (1-4 and Return are menu commands, see AppCommands).
    @ViewBuilder
    private var keyboardLetters: some View {
        #if os(macOS)
        ZStack {
            ForEach(Array(["a", "b", "c", "d"].enumerated()), id: \.offset) { i, k in
                Button("") { choose(i) }
                    .keyboardShortcut(KeyEquivalent(Character(k)), modifiers: [])
            }
        }
        .opacity(0)
        .frame(width: 0, height: 0)
        .accessibilityHidden(true)
        #endif
    }
}

/// Top bar for full-screen flows: close, progress rule, trailing control.
struct FlowBar<Trailing: View>: View {
    @Environment(\.palette) private var c
    let closeLabel: String
    var progress: Double?
    let onClose: () -> Void
    @ViewBuilder var trailing: Trailing

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: Space.md) {
                Button(action: onClose) {
                    Image(systemName: Glyph.close)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(c.ink)
                        .frame(width: Target.min, height: Target.min)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                #if os(visionOS)
                .hoverEffect(.highlight)
                #endif
                .keyboardShortcut(.cancelAction)
                .help(closeLabel)
                .accessibilityLabel(closeLabel)
                if let progress {
                    ProgressBar(value: progress, color: c.red, height: 8)
                } else {
                    Spacer()
                }
                trailing
            }
            .padding(.horizontal, Space.lg)
            .padding(.vertical, Space.sm)
            HRule()
        }
    }
}
