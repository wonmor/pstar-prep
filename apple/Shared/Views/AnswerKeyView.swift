import SwiftUI

/// 04 Answer Key: every question with the correct answer, search + filters.
struct AnswerKeyView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    @State private var query = ""

    var body: some View {
        let exam = model.exam
        let result = AnswerKey.filter(exam: exam, filter: model.answerKeyFilter, query: query, progress: model.progress, isPro: store.isPro)
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ScreenHeader(index: "04", title: "Answer Key", accent: c.blue, sub: "Every question with the correct answer highlighted.")
                HStack(spacing: Space.sm) {
                    Image(systemName: Glyph.search).foregroundStyle(c.inkSoft)
                    TextField("Search questions", text: $query)
                        .textFieldStyle(.plain)
                        .font(.jost(.medium, 16))
                        .foregroundStyle(c.ink)
                    if !query.isEmpty {
                        Button { query = "" } label: { Image(systemName: Glyph.close) }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Clear search")
                    }
                }
                .padding(.horizontal, Space.md)
                .frame(minHeight: Target.min + 4)
                .overlay(Rectangle().strokeBorder(c.ink, lineWidth: RuleWeight.mid))
                .padding(.bottom, Space.md)

                chips(exam: exam)
                    .padding(.bottom, Space.lg)

                ForEach(result.visible) { q in
                    AnswerCard(q: q).padding(.bottom, Space.xl)
                }
                if result.hidden > 0 {
                    HStack(spacing: 6) {
                        Image(systemName: Glyph.lock)
                        Text("\(result.hidden) more \(result.hidden == 1 ? "answer" : "answers") in locked sections.")
                    }
                    .font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                    .padding(.bottom, Space.sm)
                    ProBanner(reason: .answers)
                } else if result.visible.isEmpty {
                    VStack(spacing: Space.sm) {
                        Image(systemName: Glyph.close).font(.system(size: 48)).foregroundStyle(c.red)
                        Text("No questions match.").font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, Space.xl)
                }
            }
            .frame(maxWidth: 760, alignment: .leading)
            .padding(Space.xl)
            .frame(maxWidth: .infinity)
        }
        .background(c.paper)
    }

    private func chips(exam: Exam) -> some View {
        FlowLayout(spacing: Space.sm) {
            chip("All", active: model.answerKeyFilter == .all) { model.answerKeyFilter = .all }
            chip("Saved \(model.progress.bookmarks.count)", glyph: Glyph.star, active: model.answerKeyFilter == .bookmarks) {
                model.answerKeyFilter = .bookmarks
            }
            ForEach(exam.sections) { s in
                let open = model.canSection(s.id, isPro: store.isPro)
                chip("\(s.id). \(s.name)", locked: !open, active: model.answerKeyFilter == .section(s.id)) {
                    if open { model.answerKeyFilter = .section(s.id) } else { model.paywall = .section }
                }
            }
        }
    }

    private func chip(_ label: String, glyph: String? = nil, locked: Bool = false, active: Bool, action: @escaping () -> Void) -> some View {
        let fg = active ? (c.isGlass ? Color(hex: 0x141414) : c.paper) : (locked ? c.inkSoft : c.ink)
        return Button(action: action) {
            HStack(spacing: 4) {
                if locked { Image(systemName: Glyph.lock).font(.system(size: 11, weight: .semibold)).foregroundStyle(c.red) }
                if let glyph { Image(systemName: glyph).font(.system(size: 11, weight: .semibold)).foregroundStyle(active ? fg : c.red) }
                Text(label).font(.jost(.bold, 13)).foregroundStyle(fg)
            }
            .padding(.horizontal, Space.md)
            .frame(minHeight: Target.min - 8)
            .background(active ? c.ink : Color.clear)
            .overlay(Rectangle().strokeBorder(c.ink, lineWidth: RuleWeight.mid))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .accessibilityLabel(label + (locked ? ", locked, Pro only" : ""))
        .accessibilityAddTraits(active ? .isSelected : [])
    }
}

struct AnswerCard: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.palette) private var c
    let q: Question

    var body: some View {
        let marked = model.progress.isBookmarked(q.id)
        VStack(alignment: .leading, spacing: Space.sm) {
            HRule()
            HStack {
                Text("Q \(q.id)").font(.jost(.bold, 12)).tracking(2).foregroundStyle(c.red)
                Spacer()
                Button { model.toggleBookmark(q.id) } label: {
                    Image(systemName: marked ? Glyph.star : Glyph.starOpen)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(marked ? c.red : c.ink)
                        .frame(width: Target.min, height: Target.min)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(marked ? "Remove bookmark from question \(q.id)" : "Bookmark question \(q.id)")
            }
            Text(q.question).font(.jost(.bold, 17)).foregroundStyle(c.ink).fixedSize(horizontal: false, vertical: true)
            VStack(spacing: Space.sm) {
                ForEach(Array(q.options.enumerated()), id: \.offset) { i, opt in
                    OptionRow(index: i, text: opt, state: i == q.answer - 1 ? .correct : .idle, disabled: true)
                }
            }
            .padding(.top, Space.xs)
            if !q.reference.isEmpty {
                Text("REF | \(q.reference)").font(.jost(.regular, 13)).foregroundStyle(c.inkSoft).padding(.top, Space.xs)
            }
        }
    }
}

/// Minimal wrapping layout for filter chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 600
        var x: CGFloat = 0, y: CGFloat = 0, row: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > width { x = 0; y += row + spacing; row = 0 }
            x += s.width + spacing
            row = max(row, s.height)
        }
        return CGSize(width: width, height: y + row)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, row: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > bounds.minX && x + s.width > bounds.maxX { x = bounds.minX; y += row + spacing; row = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing
            row = max(row, s.height)
        }
    }
}
