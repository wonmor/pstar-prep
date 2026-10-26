import SwiftUI

struct ResultsView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    let result: QuizResult

    var body: some View {
        let passed = result.passed
        let wrong = model.exam.questions.filter { result.wrongIDs.contains($0.id) }
        let fg: Color = c.isGlass ? Color(hex: 0x141414) : c.paper
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: Space.sm) {
                    HStack {
                        Text(result.isMock ? "MOCK EXAM RESULT" : "PRACTICE RESULT").font(.jost(.heavy, 12)).tracking(3)
                        Spacer()
                        Image(systemName: passed ? Glyph.check : Glyph.warning)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(passed ? c.yellow : c.red)
                    }
                    (Text("\(result.pct)").font(.jost(.black, 120, relativeTo: .largeTitle))
                        + Text("%").font(.jost(.black, 48, relativeTo: .largeTitle)))
                        .tracking(-4)
                    HRule(weight: RuleWeight.mid, color: fg)
                    Text("\(result.correct) of \(result.total) correct").font(.jost(.bold, 17))
                    if result.isMock {
                        Text(passed ? "PASS | \(result.passPct)% REQUIRED" : "BELOW \(result.passPct)% PASS MARK | KEEP STUDYING")
                            .font(.jost(.heavy, 13)).tracking(1.5)
                    }
                }
                .foregroundStyle(fg)
                .padding(Space.xl)
                .background(passed ? c.blue : c.ink)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Score \(result.pct) percent. \(result.correct) of \(result.total) correct.\(result.isMock ? (passed ? " Pass." : " Below pass mark.") : "")")

                HStack(spacing: Space.md) {
                    Button {
                        let scope: QuizScope = result.isMock ? .mock : (model.session.flatMap { s -> QuizScope? in
                            if case .quiz(let q) = s { return q } else { return nil }
                        } ?? .mock)
                        model.endSession()
                        DispatchQueue.main.async { model.start(.quiz(scope), isPro: store.isPro) }
                    } label: { BauhausLabel(title: "Try again", trailing: Glyph.refresh) }
                        .buttonStyle(BauhausButtonStyle(variant: .red))
                    Button {
                        model.endSession()
                        model.destination = .home
                    } label: { BauhausLabel(title: "Home") }
                        .buttonStyle(BauhausButtonStyle(variant: .ghost))
                }
                .padding(.top, Space.lg)

                if !store.isPro { ProBanner(reason: .results).padding(.top, Space.xl) }

                if wrong.isEmpty {
                    VStack(spacing: Space.sm) {
                        Image(systemName: Glyph.check).font(.system(size: 56, weight: .bold)).foregroundStyle(c.blue)
                        Text("Perfect run, nothing to review.").font(.jost(.bold, 17)).foregroundStyle(c.ink)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, Space.xl)
                } else {
                    Text("Review your misses").font(.jost(.heavy, 22, relativeTo: .title2)).foregroundStyle(c.ink).padding(.top, Space.xxl)
                    Text("\(wrong.count) to revisit. The correct answer is marked with a check.")
                        .font(.jost(.medium, 14)).foregroundStyle(c.inkSoft).padding(.bottom, Space.md)
                    ForEach(wrong) { q in AnswerCard(q: q).padding(.bottom, Space.xl) }
                }
            }
            .frame(maxWidth: 760, alignment: .leading)
            .padding(Space.xl)
            .frame(maxWidth: .infinity)
        }
        .focusedSceneValue(\.studyActions, StudyActions(close: { model.endSession() }))
    }
}
