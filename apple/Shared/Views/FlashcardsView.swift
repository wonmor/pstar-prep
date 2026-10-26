import SwiftUI

struct FlashcardsView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.palette) private var c
    let scope: DeckScope
    #if os(macOS)
    static let verb = "Click"
    #else
    static let verb = "Tap"
    #endif
    @State private var deck: [Question]
    @State private var idx = 0
    @State private var flipped = false

    init(deck: [Question], scope: DeckScope) {
        self.scope = scope
        _deck = State(initialValue: deck.shuffled())
    }

    var body: some View {
        Group {
            if deck.isEmpty {
                VStack(spacing: Space.md) {
                    Image(systemName: Glyph.cards).font(.system(size: 64)).foregroundStyle(c.yellow)
                    Text("No cards in this deck yet.").font(.jost(.bold, 17)).foregroundStyle(c.ink)
                    Button { model.endSession() } label: { BauhausLabel(title: "Back") }
                        .buttonStyle(BauhausButtonStyle(variant: .ghost))
                        .frame(maxWidth: 320)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                card
            }
        }
        .background(c.paper)
    }

    private func advance(_ known: Bool) {
        model.setKnown(deck[idx].id, known)
        if idx < deck.count - 1 {
            idx += 1
            flipped = false
        } else {
            model.endSession()
        }
    }

    private var card: some View {
        let q = deck[idx]
        let bookmarked = model.progress.isBookmarked(q.id)
        let isKnown = model.progress.isKnown(q.id)
        return VStack(spacing: 0) {
            FlowBar(closeLabel: "Close flashcards", progress: Double(idx + 1) / Double(deck.count), onClose: { model.endSession() }) {
                Button { model.toggleBookmark(q.id) } label: {
                    Image(systemName: bookmarked ? Glyph.star : Glyph.starOpen)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(bookmarked ? c.red : c.ink)
                        .frame(width: Target.min, height: Target.min)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(bookmarked ? "Remove bookmark" : "Bookmark card")
            }
            HStack(alignment: .firstTextBaseline) {
                Kicker(Decks.title(exam: model.exam, scope: scope)).lineLimit(1)
                Spacer()
                (Text(String(format: "%02d", idx + 1)).foregroundColor(c.red) + Text("/\(deck.count)").foregroundColor(c.inkSoft))
                    .font(.jost(.black, 28))
            }
            .frame(maxWidth: 760)
            .padding(.horizontal, Space.xl)
            .padding(.top, Space.md)

            Button { flipped.toggle() } label: { face(q) }
                .buttonStyle(.plain)
                #if os(visionOS)
                .hoverEffect(.highlight)
                #endif
                .frame(maxWidth: 760)
                .padding(Space.xl)
                .accessibilityHint(flipped ? "Shows the question" : "Reveals the answer")

            VStack(spacing: Space.sm) {
                if isKnown {
                    HStack(spacing: 6) {
                        Image(systemName: Glyph.check)
                        Text("MARKED AS MASTERED")
                    }
                    .font(.jost(.heavy, 12)).tracking(2).foregroundStyle(c.blue)
                }
                HStack(spacing: Space.md) {
                    Button { advance(false) } label: { BauhausLabel(title: "Again", trailing: Glyph.refresh) }
                        .buttonStyle(BauhausButtonStyle(variant: .ghost))
                    Button { advance(true) } label: { BauhausLabel(title: "Got it", trailing: Glyph.check) }
                        .buttonStyle(BauhausButtonStyle(variant: .blue))
                }
            }
            .frame(maxWidth: 760)
            .padding(Space.lg)
            .frame(maxWidth: .infinity)
            .overlay(alignment: .top) { HRule() }
        }
        .focusedSceneValue(\.studyActions, StudyActions(
            bookmark: { model.toggleBookmark(q.id) },
            flip: { flipped.toggle() },
            again: { advance(false) },
            gotIt: { advance(true) },
            close: { model.endSession() }))
        .animation(.easeOut(duration: 0.15), value: flipped)
    }

    private func face(_ q: Question) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(flipped ? "ANSWER" : "QUESTION").font(.jost(.heavy, 12)).tracking(3)
                Spacer()
                Image(systemName: flipped ? Glyph.check : Glyph.help).font(.system(size: 16, weight: .bold))
            }
            .foregroundStyle(flipped ? c.onAccent : c.onYellow)
            .padding(.horizontal, Space.lg)
            .padding(.vertical, Space.sm)
            .background(flipped ? c.blue : c.yellow)

            ScrollView {
                VStack(alignment: .leading, spacing: Space.lg) {
                    Text(q.question).font(.jost(.bold, 22, relativeTo: .title2)).foregroundStyle(c.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    if !flipped {
                        VStack(alignment: .leading, spacing: Space.sm) {
                            ForEach(Array(q.options.enumerated()), id: \.offset) { i, o in
                                HStack(alignment: .firstTextBaseline, spacing: Space.md) {
                                    Text("\(i + 1)").font(.jost(.black, 16)).frame(width: 16)
                                    Text(o).font(.jost(.regular, 15)).fixedSize(horizontal: false, vertical: true)
                                }
                                .foregroundStyle(c.inkSoft)
                            }
                        }
                    } else {
                        HStack(spacing: Space.md) {
                            Image(systemName: Glyph.check).font(.system(size: 24, weight: .bold))
                            Text(q.correctOption).font(.jost(.bold, 18)).fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 0)
                        }
                        .foregroundStyle(c.onAccent)
                        .padding(Space.lg)
                        .background(c.blue)
                        if !q.reference.isEmpty {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("REFERENCE").font(.jost(.bold, 14)).foregroundStyle(c.ink)
                                Text(q.reference).font(.jost(.regular, 14)).foregroundStyle(c.inkSoft)
                            }
                        }
                    }
                }
                .padding(Space.xl)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(minHeight: 260, maxHeight: .infinity)

            HStack(spacing: 6) {
                Image(systemName: Glyph.refresh)
                Text(flipped ? "\(Self.verb) to see question" : "\(Self.verb) to reveal answer")
                #if os(macOS)
                Text("(Space)").foregroundStyle(c.inkSoft.opacity(0.8))
                #endif
            }
            .font(.jost(.bold, 12)).tracking(1).foregroundStyle(c.inkSoft)
            .padding(.vertical, Space.sm)
        }
        .overlay(Rectangle().strokeBorder(flipped ? c.blue : c.ink, lineWidth: RuleWeight.thick))
        .contentShape(Rectangle())
    }
}
