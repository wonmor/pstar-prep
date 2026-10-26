import SwiftUI

struct AboutView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    @Environment(\.openURL) private var openURL
    @State private var confirmReset = false
    @State private var restoreMsg: String?

    var body: some View {
        let exam = model.exam
        Page {
            ScreenHeader(index: "05", title: "About", accent: c.red, sub: "\(Links.appName) \(Links.version)")
            ExamSwitch().padding(.bottom, Space.md)

            group("Membership") {
                row(store.isPro ? Glyph.unlock : Glyph.lock, c.red, store.isPro ? "Pro is active" : "Unlock Pro",
                    value: store.isPro ? "All sections" : nil) { model.paywall = .banner }
                row(Glyph.refresh, c.ink, restoreMsg ?? "Restore purchases") {
                    Task { restoreMsg = await store.restore() ? "Pro restored" : "No purchase found" }
                }
            }

            #if os(macOS)
            group("Appearance") {
                ForEach(ThemeMode.allCases) { m in
                    row(m == .dark ? Glyph.moon : Glyph.sun, c.ink, m.label, value: model.theme == m ? "Selected" : nil) {
                        model.theme = m
                    }
                }
            }
            #endif

            group("Your \(exam.meta.shortName) progress") {
                row(Glyph.exam, c.blue, "Questions seen", value: "\(model.progress.seenCount)/\(exam.questions.count)")
                row(Glyph.check, c.blue, "Mastered cards", value: "\(model.progress.known.count)")
                row(Glyph.trash, c.red, "Reset \(exam.meta.shortName) progress", danger: true) { confirmReset = true }
            }

            group("Source") {
                row(Glyph.document, c.ink, exam.meta.sourceLabel) { openURL(exam.meta.sourceURL) }
                row(Glyph.warning, c.red, "Disclaimer") { model.showDisclaimer = true }
            }

            group("Legal & contact") {
                row(Glyph.shield, c.ink, "Privacy Policy") { openURL(Links.privacy) }
                row(Glyph.document, c.ink, "Terms of Use (EULA)") { openURL(Links.terms) }
                row(Glyph.globe, c.ink, "Website") { openURL(Links.site) }
                row(Glyph.mail, c.ink, "Contact", value: Links.contact) {
                    if let u = URL(string: "mailto:\(Links.contact)") { openURL(u) }
                }
            }

            Text("All progress stays on this device. No account, no tracking.")
                .font(.jost(.medium, 13)).foregroundStyle(c.inkSoft).padding(.top, Space.xl)
        }
        .confirmationDialog("Reset all \(exam.meta.shortName) progress, scores, bookmarks and mastered cards?",
                            isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { model.resetProgress() }
            Button("Cancel", role: .cancel) {}
        }
    }

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Kicker(title).padding(.bottom, Space.sm)
            HRule()
            content()
        }
        .padding(.top, Space.xl)
    }

    private func row(_ glyph: String, _ tint: Color, _ label: String, value: String? = nil, danger: Bool = false,
                     action: (() -> Void)? = nil) -> some View {
        Button { action?() } label: {
            HStack(spacing: Space.md) {
                Image(systemName: glyph).font(.system(size: 17)).foregroundStyle(danger ? c.red : tint).frame(width: 26)
                Text(label).font(.jost(.bold, 16)).foregroundStyle(danger ? c.red : c.ink)
                Spacer()
                if let value { Text(value).font(.jost(.medium, 14)).foregroundStyle(c.inkSoft) }
                if action != nil { Image(systemName: Glyph.arrow).font(.system(size: 15, weight: .semibold)).foregroundStyle(c.ink) }
            }
            .frame(minHeight: Target.min + 8)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(action == nil)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .overlay(alignment: .bottom) { HRule(weight: RuleWeight.hair) }
    }
}

struct DisclaimerView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.palette) private var c
    @Environment(\.dismiss) private var dismiss
    /// First launch: must be acknowledged.
    let gate: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: Glyph.warning).font(.system(size: 14, weight: .bold))
                Text("IMPORTANT").font(.jost(.heavy, 12)).tracking(3)
                Spacer()
            }
            .foregroundStyle(c.onAccent)
            .padding(.horizontal, Space.xl)
            .padding(.vertical, Space.sm)
            .background(c.red)
            ScrollView {
                VStack(alignment: .leading, spacing: Space.md) {
                    Text("Disclaimer").font(.jost(.black, 34)).foregroundStyle(c.ink).accessibilityAddTraits(.isHeader)
                    HRule(weight: RuleWeight.heavy)
                    ForEach(model.meta.disclaimer, id: \.self) { p in
                        Text(p).font(.jost(.medium, 15)).foregroundStyle(c.ink).fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(Space.xl)
            }
            Button {
                if gate { model.acceptDisclaimer() }
                dismiss()
            } label: { BauhausLabel(title: gate ? "I understand" : "Close", trailing: gate ? Glyph.check : nil) }
                .buttonStyle(BauhausButtonStyle(variant: gate ? .red : .primary))
                .keyboardShortcut(.defaultAction)
                .padding(Space.lg)
        }
        .frame(minWidth: 460, idealWidth: 560, minHeight: 520, idealHeight: 640)
        .background(c.paper)
        .interactiveDismissDisabled(gate)
    }
}
