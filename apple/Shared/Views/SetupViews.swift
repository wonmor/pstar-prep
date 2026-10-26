import SwiftUI

/// 02 Practice: full mock exam card + drill by section.
struct PracticeView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c

    var body: some View {
        let exam = model.exam
        let canMock = model.canMock(isPro: store.isPro)
        Page {
            ScreenHeader(index: "02", title: "Practice", accent: c.blue, sub: "Take a full mock exam, or drill one section at a time.")
            ExamSwitch().padding(.bottom, Space.xl)

            VStack(alignment: .leading, spacing: Space.sm) {
                HStack {
                    Text("FULL MOCK EXAM").font(.jost(.heavy, 12)).tracking(3)
                    Spacer()
                    Image(systemName: Glyph.exam).font(.system(size: 26, weight: .regular)).foregroundStyle(c.yellow)
                }
                Text("\(exam.examSize)").font(.jost(.black, 96, relativeTo: .largeTitle)).tracking(-4)
                Text("questions drawn at random from all \(exam.questions.count). Pass mark \(exam.passPct)%, just like the real \(exam.meta.shortName). Answers revealed at the end.")
                    .font(.jost(.medium, 15))
                    .fixedSize(horizontal: false, vertical: true)
                if !store.isPro {
                    HStack(spacing: 6) {
                        Image(systemName: canMock ? Glyph.calendar : Glyph.lock)
                        Text(canMock ? "1 free mock exam today" : "Today\u{2019}s free mock used, unlimited with Pro")
                    }
                    .font(.jost(.bold, 14))
                }
                Button {
                    model.start(.quiz(.mock), isPro: store.isPro)
                } label: {
                    BauhausLabel(title: canMock ? "Start mock exam" : "Unlock unlimited mocks", trailing: Glyph.arrow)
                }
                .buttonStyle(BauhausButtonStyle(variant: canMock ? .red : .yellow))
                .padding(.top, Space.md)
            }
            .foregroundStyle(c.isGlass ? c.ink : c.paper)
            .padding(Space.xl)
            .background(c.isGlass ? Color.black.opacity(0.35) : c.ink)

            HStack(alignment: .firstTextBaseline) {
                Text("By section").font(.jost(.heavy, 22, relativeTo: .title2)).foregroundStyle(c.ink)
                Spacer()
                Text("Instant feedback").font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
            }
            .padding(.top, Space.xxl)
            .padding(.bottom, Space.sm)
            SectionIndex { id in model.start(.quiz(.section(id)), isPro: store.isPro) }
            ProBanner().padding(.top, Space.xl)
        }
    }
}

/// 03 Flashcards: decks.
struct CardsSetupView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c

    var body: some View {
        let exam = model.exam
        let all = Decks.cards(exam: exam, scope: .all, progress: model.progress, isPro: store.isPro).count
        let saved = Decks.cards(exam: exam, scope: .bookmarks, progress: model.progress, isPro: store.isPro).count
        Page {
            ScreenHeader(index: "03", title: "Flashcards", accent: c.yellow, sub: "Flip a card: question on the front, answer & reference on the back.")
            ExamSwitch().padding(.bottom, Space.xl)
            VStack(spacing: 0) {
                HRule()
                deckRow(glyph: Glyph.cards, tint: c.blue,
                        title: store.isPro ? "All questions" : "All free cards",
                        desc: store.isPro ? "Shuffle the entire bank" : "Free sample, all \(exam.questions.count) with Pro",
                        count: all) { model.start(.cards(.all), isPro: store.isPro) }
                deckRow(glyph: Glyph.starOpen, tint: c.red, title: "Bookmarked", desc: "Cards you starred", count: saved) {
                    model.start(.cards(.bookmarks), isPro: store.isPro)
                }
                .disabled(saved == 0)
                .opacity(saved == 0 ? 0.45 : 1)
            }
            Text("By section").font(.jost(.heavy, 22, relativeTo: .title2)).foregroundStyle(c.ink)
                .padding(.top, Space.xxl).padding(.bottom, Space.sm)
            SectionIndex { id in model.start(.cards(.section(id)), isPro: store.isPro) }
            ProBanner().padding(.top, Space.xl)
        }
    }

    private func deckRow(glyph: String, tint: Color, title: String, desc: String, count: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Space.md) {
                Image(systemName: glyph).font(.system(size: 26)).foregroundStyle(tint).frame(width: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.jost(.heavy, 18)).foregroundStyle(c.ink)
                    Text(desc).font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                }
                Spacer()
                Text("\(count)").font(.jost(.black, 30)).foregroundStyle(c.ink)
            }
            .padding(.vertical, Space.md)
            .frame(minHeight: 64)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .overlay(alignment: .bottom) { HRule(weight: RuleWeight.mid) }
        .accessibilityLabel("\(title), \(count) cards. \(desc)")
    }
}
