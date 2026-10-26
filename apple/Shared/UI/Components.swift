// Bauhaus building blocks shared by every screen (src/components/ui.tsx).
import SwiftUI

struct Kicker: View {
    @Environment(\.palette) private var c
    let text: String
    var color: Color?
    init(_ text: String, color: Color? = nil) { self.text = text; self.color = color }
    var body: some View {
        Text(text.uppercased())
            .font(.jost(.bold, 12, relativeTo: .caption))
            .tracking(2)
            .foregroundStyle(color ?? c.ink)
    }
}

/// A horizontal rule (structure, not ornament).
struct HRule: View {
    @Environment(\.palette) private var c
    var weight: CGFloat = RuleWeight.thick
    var color: Color?
    var body: some View {
        Rectangle().fill(color ?? c.ink).frame(height: weight).accessibilityHidden(true)
    }
}

struct ProgressBar: View {
    @Environment(\.palette) private var c
    let value: Double
    let color: Color
    var height: CGFloat = 6
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Rectangle().fill(c.paperDeep)
                Rectangle().fill(color).frame(width: geo.size.width * max(0, min(1, value)))
            }
        }
        .frame(height: height)
        .accessibilityElement()
        .accessibilityLabel("Progress")
        .accessibilityValue("\(Int((value * 100).rounded())) percent")
    }
}

struct LockTag: View {
    @Environment(\.palette) private var c
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: Glyph.lock).font(.system(size: 11, weight: .semibold))
            Text("PRO").font(.jost(.heavy, 11, relativeTo: .caption2)).tracking(1.5)
        }
        .foregroundStyle(c.red)
        .accessibilityLabel("Pro only")
    }
}

/// Big numbered page header: "02 Practice".
struct ScreenHeader: View {
    @Environment(\.palette) private var c
    let index: String
    let title: String
    let accent: Color
    let sub: String
    var body: some View {
        VStack(alignment: .leading, spacing: Space.sm) {
            HStack(alignment: .firstTextBaseline, spacing: Space.md) {
                Text(index)
                    .font(.jost(.black, 40, relativeTo: .largeTitle))
                    .foregroundStyle(accent)
                Text(title)
                    .font(.jost(.black, 40, relativeTo: .largeTitle))
                    .foregroundStyle(c.ink)
                    .accessibilityAddTraits(.isHeader)
            }
            HRule(weight: RuleWeight.heavy)
            Text(sub).font(.jost(.medium, 15)).foregroundStyle(c.inkSoft)
        }
        .padding(.bottom, Space.lg)
    }
}

enum BauhausVariant { case primary, red, blue, yellow, ghost }

struct BauhausButtonStyle: ButtonStyle {
    @Environment(\.palette) private var c
    @Environment(\.isEnabled) private var enabled
    var variant: BauhausVariant = .primary
    var small = false

    func makeBody(configuration: Configuration) -> some View {
        let (bg, fg, border): (Color, Color, Color) = {
            switch variant {
            case .primary: return (c.ink, c.isGlass ? Color(hex: 0x141414) : c.paper, c.ink)
            case .red: return (c.red, c.onAccent, c.red)
            case .blue: return (c.blue, c.onAccent, c.blue)
            case .yellow: return (c.yellow, c.onYellow, c.yellow)
            case .ghost: return (configuration.isPressed ? c.paperDeep : .clear, c.ink, c.ink)
            }
        }()
        configuration.label
            .font(.jost(.heavy, small ? 13 : 15, relativeTo: .headline))
            .tracking(1.2)
            .textCase(.uppercase)
            .foregroundStyle(fg)
            .frame(maxWidth: small ? nil : .infinity, minHeight: small ? Target.min - 8 : Target.min)
            .padding(.horizontal, Space.lg)
            .background(bg)
            .overlay(Rectangle().strokeBorder(border, lineWidth: RuleWeight.mid))
            .opacity(enabled ? (configuration.isPressed && variant != .ghost ? 0.82 : 1) : 0.4)
            .contentShape(Rectangle())
            #if os(visionOS)
            .hoverEffect(.highlight)
            #endif
    }
}

struct BauhausLabel: View {
    let title: String
    var trailing: String?
    var body: some View {
        HStack(spacing: Space.sm) {
            Text(title)
            if let trailing { Image(systemName: trailing).font(.system(size: 14, weight: .bold)) }
        }
    }
}

/// One answer option. The numeral is typographic (1-4); feedback uses the
/// check / cross line glyphs.
struct OptionRow: View {
    @Environment(\.palette) private var c
    let index: Int
    let text: String
    let state: OptionState
    var disabled = false
    var action: () -> Void = {}

    var body: some View {
        let (bg, fg, border): (Color, Color, Color) = {
            switch state {
            case .idle: return (.clear, c.ink, c.ink)
            case .selected: return (c.ink, c.isGlass ? Color(hex: 0x141414) : c.paper, c.ink)
            case .correct: return (c.blue, c.onAccent, c.blue)
            case .wrong: return (c.red, c.onAccent, c.red)
            }
        }()
        Button(action: action) {
            HStack(alignment: .center, spacing: Space.md) {
                Group {
                    switch state {
                    case .correct: Image(systemName: Glyph.check).font(.system(size: 22, weight: .bold))
                    case .wrong: Image(systemName: Glyph.close).font(.system(size: 22, weight: .bold))
                    default: Text("\(index + 1)").font(.jost(.black, 26, relativeTo: .title2))
                    }
                }
                .frame(width: 32)
                Text(text)
                    .font(.jost(state == .correct ? .bold : .medium, 17))
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .foregroundStyle(fg)
            .padding(.horizontal, Space.md)
            .padding(.vertical, Space.md)
            .frame(minHeight: Target.min + 12)
            .background(bg)
            .overlay(Rectangle().strokeBorder(border, lineWidth: RuleWeight.mid))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        // Not `.disabled`: that would dim the revealed answer colours.
        .allowsHitTesting(!disabled)
        .accessibilityLabel("Option \(index + 1): \(text)\(Self.a11y(state))")
        .accessibilityAddTraits(disabled ? .isStaticText : [])
    }

    static func a11y(_ s: OptionState) -> String {
        switch s {
        case .correct: return ", correct answer"
        case .wrong: return ", your answer, incorrect"
        case .selected: return ", selected"
        case .idle: return ""
        }
    }
}

/// PSTAR | ROC-A switch.
struct ExamSwitch: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.palette) private var c
    var body: some View {
        HStack(spacing: 0) {
            ForEach(ExamID.allCases) { id in
                let on = model.examID == id
                Button {
                    model.examID = id
                } label: {
                    HStack(spacing: Space.sm) {
                        Image(systemName: id == .pstar ? Glyph.airplane : Glyph.radio)
                            .font(.system(size: 15, weight: .semibold))
                        Text(ExamMeta.of(id).shortName)
                            .font(.jost(.heavy, 15, relativeTo: .headline))
                            .tracking(1.5)
                    }
                    .foregroundStyle(on ? (c.isGlass ? Color(hex: 0x141414) : c.paper) : c.ink)
                    .frame(maxWidth: .infinity, minHeight: Target.min)
                    .background(on ? c.ink : Color.clear)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                #if os(visionOS)
                .hoverEffect(.highlight)
                #endif
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .overlay(Rectangle().strokeBorder(c.ink, lineWidth: RuleWeight.mid))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Exam")
    }
}

/// Yellow upsell block for the free tier.
struct ProBanner: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    var reason: PaywallReason = .banner
    var body: some View {
        if !store.isPro {
            Button {
                model.paywall = reason
            } label: {
                HStack(spacing: Space.md) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: Glyph.unlock).font(.system(size: 12, weight: .bold))
                            Text("PRO").font(.jost(.heavy, 12)).tracking(2)
                        }
                        Text("Unlock \(Gating.lockedSectionCount(isPro: false, sections: model.exam.sections)) more sections & unlimited mock exams")
                            .font(.jost(.heavy, 17))
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: Glyph.arrow).font(.system(size: 20, weight: .bold))
                }
                .foregroundStyle(c.onYellow)
                .padding(Space.lg)
                .background(c.yellow)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            #if os(visionOS)
            .hoverEffect(.highlight)
            #endif
            .accessibilityLabel("Unlock Pro: all \(model.exam.sections.count) sections and unlimited mock exams")
        }
    }
}

/// The active exam's sections as a ruled index: numeral, name, mastery.
/// Locked sections (free tier) show a lock and open the paywall instead.
struct SectionIndex: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    let onPick: (Int) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ForEach(model.exam.sections) { s in
                let qs = model.exam.questions(inSection: s.id)
                let pct = model.progress.mastery(qs)
                let open = model.canSection(s.id, isPro: store.isPro)
                Button {
                    if open { onPick(s.id) } else { model.paywall = .section }
                } label: {
                    HStack(spacing: Space.md) {
                        Text(String(format: "%02d", s.id))
                            .font(.jost(.black, 28, relativeTo: .title))
                            .foregroundStyle(open ? (pct >= 0.9 ? c.blue : c.ink) : c.inkSoft)
                            .frame(width: 52, alignment: .leading)
                        VStack(alignment: .leading, spacing: 6) {
                            Text(s.name)
                                .font(.jost(.bold, 16))
                                .foregroundStyle(open ? c.ink : c.inkSoft)
                                .multilineTextAlignment(.leading)
                            if open {
                                ProgressBar(value: pct, color: pct >= 0.9 ? c.blue : c.red)
                            } else {
                                LockTag()
                            }
                        }
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(open ? "\(Int((pct * 100).rounded()))%" : "")
                                .font(.jost(.black, 16)).foregroundStyle(c.ink)
                            Text("\(qs.count) Q").font(.jost(.bold, 12)).foregroundStyle(c.inkSoft)
                        }
                        .frame(width: 52, alignment: .trailing)
                        Image(systemName: open ? Glyph.arrow : Glyph.lock)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(open ? c.ink : c.inkSoft)
                    }
                    .padding(.vertical, Space.md)
                    .padding(.horizontal, Space.xs)
                    .frame(minHeight: Target.min + 16)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                #if os(visionOS)
                .hoverEffect(.highlight)
                #endif
                .accessibilityLabel("Section \(s.id), \(s.name), \(qs.count) questions, \(Int((pct * 100).rounded())) percent\(open ? "" : ", locked, Pro only")")
                HRule(weight: RuleWeight.hair)
            }
        }
    }
}

/// A stat cell in the Home stats strip.
struct StatCell: View {
    @Environment(\.palette) private var c
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.jost(.black, 32, relativeTo: .largeTitle)).foregroundStyle(c.ink)
            Text(label.uppercased()).font(.jost(.bold, 11, relativeTo: .caption2)).tracking(1.5).foregroundStyle(c.inkSoft)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, Space.md)
        .padding(.horizontal, Space.sm)
        .accessibilityElement(children: .combine)
    }
}

/// Scrollable page with the standard column width and padding.
struct Page<Content: View>: View {
    @Environment(\.palette) private var c
    var maxWidth: CGFloat = 760
    @ViewBuilder var content: Content
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) { content }
                .frame(maxWidth: maxWidth, alignment: .leading)
                .padding(.horizontal, Space.xl)
                .padding(.vertical, Space.xl)
                .frame(maxWidth: .infinity)
        }
        .background(c.paper)
    }
}
