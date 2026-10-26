import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c

    var body: some View {
        let exam = model.exam
        let p = model.progress
        let canMock = model.canMock(isPro: store.isPro)
        Page {
            ExamSwitch().padding(.bottom, Space.xl)

            Kicker(exam.meta.kicker)
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(exam.meta.shortName)
                        .font(.jost(.black, 84, relativeTo: .largeTitle))
                        .tracking(-3)
                        .foregroundStyle(c.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                        .accessibilityAddTraits(.isHeader)
                    Text("Prep | \(exam.meta.badge)")
                        .font(.jost(.heavy, 18))
                        .tracking(2)
                        .textCase(.uppercase)
                        .foregroundStyle(c.red)
                }
                Spacer()
                Image("BrandMark")
                    .resizable()
                    .interpolation(.high)
                    .frame(width: 80, height: 80)
                    .accessibilityHidden(true)
            }
            .padding(.vertical, Space.sm)
            HRule(weight: RuleWeight.heavy)
            Text("\(exam.meta.subtitle) \(exam.questions.count) questions across \(exam.sections.count) sections.")
                .font(.jost(.medium, 16))
                .foregroundStyle(c.ink)
                .padding(.top, Space.md)

            HStack(spacing: 0) {
                StatCell(value: "\(exam.examSize)", label: "Exam Qs")
                Rectangle().fill(c.ink).frame(width: RuleWeight.mid)
                StatCell(value: "\(exam.passPct)%", label: "Pass mark")
                Rectangle().fill(c.ink).frame(width: RuleWeight.mid)
                StatCell(value: p.bestExamPct.map { "\($0)%" } ?? "\u{2013}", label: "Best")
            }
            .fixedSize(horizontal: false, vertical: true)
            .overlay(alignment: .top) { HRule(weight: RuleWeight.mid) }
            .overlay(alignment: .bottom) { HRule(weight: RuleWeight.mid) }
            .padding(.top, Space.lg)

            // Progress
            VStack(alignment: .leading, spacing: Space.sm) {
                HStack(alignment: .firstTextBaseline) {
                    Kicker("Your progress")
                    Spacer()
                    Text("\(p.seenCount)/\(exam.questions.count) seen").font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                }
                ProgressBar(value: p.coverage(of: exam.questions.count), color: c.blue)
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(p.seenCount > 0 ? "\(p.accuracy)%" : "\u{2013}")
                            .font(.jost(.black, 48, relativeTo: .largeTitle)).foregroundStyle(c.ink)
                        Text("RECALL ACCURACY").font(.jost(.bold, 11)).tracking(1.5).foregroundStyle(c.inkSoft)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        countLine(Glyph.star, c.red, "\(p.bookmarks.count) saved")
                        countLine(Glyph.check, c.blue, "\(p.known.count) mastered")
                        countLine(Glyph.exam, c.ink, "\(p.examsTaken) exams")
                    }
                }
                .padding(.top, Space.sm)
            }
            .padding(.top, Space.xl)

            ProBanner().padding(.top, Space.xl)

            Text("Study modes")
                .font(.jost(.heavy, 22, relativeTo: .title2))
                .foregroundStyle(c.ink)
                .padding(.top, Space.xl)
                .padding(.bottom, Space.sm)
            VStack(spacing: 0) {
                HRule()
                ModeRow(n: "01", title: "Mock Exam", desc: mockDesc(canMock: canMock), tint: c.red, locked: !canMock) {
                    model.start(.quiz(.mock), isPro: store.isPro)
                }
                ModeRow(n: "02", title: "Practice Quiz", desc: "Drill a section with instant feedback", tint: c.blue) {
                    model.destination = .practice
                }
                ModeRow(n: "03", title: "Flashcards", desc: "Flip: question, answer & reference", tint: c.yellow) {
                    model.destination = .cards
                }
                ModeRow(n: "04", title: "Answer Key", desc: "Every question with its correct answer", tint: c.ink) {
                    model.showAnswers(.all)
                }
            }

            Button {
                model.showDisclaimer = true
            } label: {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Independent study aid. \(exam.meta.source). Always verify against current official sources. Not affiliated with \(exam.meta.authority).")
                        .font(.jost(.regular, 12)).foregroundStyle(c.inkSoft)
                        .multilineTextAlignment(.leading)
                    HStack(spacing: 4) {
                        Text("Read full disclaimer")
                        Image(systemName: Glyph.arrow)
                    }
                    .font(.jost(.bold, 13)).foregroundStyle(c.blue)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.top, Space.xl)
        }
    }

    private func mockDesc(canMock: Bool) -> String {
        let e = model.exam
        if store.isPro { return "\(e.examSize) random questions, \(e.passPct)% to pass" }
        return canMock ? "\(e.examSize) questions, 1 free mock today" : "Today\u{2019}s free mock used, unlimited with Pro"
    }

    private func countLine(_ glyph: String, _ tint: Color, _ text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: glyph).font(.system(size: 13, weight: .semibold)).foregroundStyle(tint)
            Text(text).font(.jost(.bold, 14)).foregroundStyle(c.ink)
        }
    }
}

struct ModeRow: View {
    @Environment(\.palette) private var c
    let n: String
    let title: String
    let desc: String
    let tint: Color
    var locked = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Space.md) {
                Text(n).font(.jost(.black, 44, relativeTo: .largeTitle)).tracking(-2).foregroundStyle(tint).frame(width: 80, alignment: .leading)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.jost(.heavy, 19)).foregroundStyle(c.ink)
                    Text(desc).font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                    if locked { LockTag() }
                }
                Spacer()
                Image(systemName: Glyph.arrow).font(.system(size: 20, weight: .semibold)).foregroundStyle(c.ink)
            }
            .padding(.vertical, Space.md)
            .frame(minHeight: 76)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .overlay(alignment: .bottom) { HRule(weight: RuleWeight.mid) }
        .accessibilityLabel("\(title). \(desc)\(locked ? ". Locked, Pro only" : "")")
    }
}
