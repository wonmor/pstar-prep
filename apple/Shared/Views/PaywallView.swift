import StoreKit
import SwiftUI

struct PaywallView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    @Environment(\.purchase) private var purchaseAction
    @Environment(\.openURL) private var openURL
    @Environment(\.dismiss) private var dismiss
    let reason: PaywallReason?

    @State private var selected: PlanID = .lifetime
    @State private var busy: String?
    @State private var message: String?

    var body: some View {
        let plan = store.plans.first { $0.id == selected } ?? store.plans.first
        VStack(spacing: 0) {
            FlowBar(closeLabel: "Close", onClose: { dismiss() }) { EmptyView() }
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Kicker("PSTAR & ROC-A Trainer")
                    HStack(alignment: .bottom) {
                        Text("PRO").font(.jost(.black, 110, relativeTo: .largeTitle)).tracking(-5).foregroundStyle(c.ink)
                            .accessibilityAddTraits(.isHeader)
                        Spacer()
                        Image("BrandMark").resizable().frame(width: 64, height: 64).padding(.bottom, Space.md).accessibilityHidden(true)
                    }
                    HRule(weight: RuleWeight.heavy)
                    if let msg = reason?.message {
                        Text(msg).font(.jost(.bold, 16)).foregroundStyle(c.red).padding(.top, Space.md)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if store.isPro {
                        VStack(alignment: .leading, spacing: Space.xs) {
                            Image(systemName: Glyph.check).font(.system(size: 40, weight: .bold)).foregroundStyle(c.blue)
                            Text("Pro is active").font(.jost(.heavy, 22)).foregroundStyle(c.ink)
                            Text("Every section and unlimited mock exams are unlocked.").font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                        }
                        .padding(.top, Space.lg)
                    }

                    VStack(alignment: .leading, spacing: Space.sm) {
                        feature(Glyph.book, c.red, "All \(totalSections) sections | \(totalQuestions) questions")
                        feature(Glyph.exam, c.blue, "Unlimited full mock exams")
                        feature(Glyph.cards, c.yellow, "Every flashcard & the full answer key")
                        feature(Glyph.swap, c.ink, "One unlock covers PSTAR and ROC-A")
                    }
                    .padding(.top, Space.lg)

                    switch store.loadState {
                    case .idle, .loading:
                        HStack(spacing: Space.sm) {
                            ProgressView().controlSize(.small)
                            Text("Loading prices").font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                        }
                        .padding(.top, Space.xl)
                    case .unavailable:
                        VStack(alignment: .leading, spacing: Space.xs) {
                            HStack(spacing: Space.sm) {
                                Image(systemName: Glyph.warning).foregroundStyle(c.red)
                                Text("Store unavailable").font(.jost(.heavy, 18)).foregroundStyle(c.ink)
                            }
                            Text("Purchases can\u{2019}t be loaded right now. The free tier keeps working. Try again later, or restore a previous purchase.")
                                .font(.jost(.medium, 14)).foregroundStyle(c.inkSoft)
                                .fixedSize(horizontal: false, vertical: true)
                            Button { Task { await store.loadPlans() } } label: { BauhausLabel(title: "Try again", trailing: Glyph.refresh) }
                                .buttonStyle(BauhausButtonStyle(variant: .ghost, small: true))
                                .padding(.top, Space.sm)
                        }
                        .padding(Space.lg)
                        .overlay(Rectangle().strokeBorder(c.ink, lineWidth: RuleWeight.mid))
                        .padding(.top, Space.xl)
                    case .ready:
                        if !store.isPro {
                            VStack(spacing: Space.sm) {
                                ForEach(store.plans) { p in planRow(p, selected: plan?.id == p.id) }
                            }
                            .padding(.top, Space.xl)
                        }
                    }

                    if let message {
                        Text(message).font(.jost(.bold, 15)).foregroundStyle(c.blue).padding(.top, Space.lg)
                    }

                    HStack(spacing: Space.lg) {
                        linkButton(busy == "restore" ? "Restoring" : "Restore purchases") { Task { await restore() } }
                            .disabled(busy != nil)
                        linkButton("Terms of Use (EULA)") { openURL(Links.terms) }
                        linkButton("Privacy Policy") { openURL(Links.privacy) }
                    }
                    .padding(.top, Space.lg)

                    Text(fineprint(plan))
                        .font(.jost(.regular, 11))
                        .foregroundStyle(c.inkSoft)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, Space.sm)
                }
                .padding(Space.xl)
            }
            if store.loadState == .ready, !store.isPro, let plan {
                Button { Task { await buy(plan) } } label: {
                    BauhausLabel(title: busy == "buy" ? "Processing" :
                                    (plan.id == .lifetime ? "Unlock forever | \(plan.priceString)" : "Start pass | \(plan.priceString) / \(plan.periodLabel ?? "month")"),
                                 trailing: Glyph.arrow)
                }
                .buttonStyle(BauhausButtonStyle(variant: .red))
                .disabled(busy != nil)
                .padding(Space.lg)
                .overlay(alignment: .top) { HRule() }
            }
        }
        .background(c.paper)
        .task { if store.loadState != .ready { await store.loadPlans() } }
    }

    private var totalSections: Int { model.exams.values.reduce(0) { $0 + $1.sections.count } }
    private var totalQuestions: Int { model.exams.values.reduce(0) { $0 + $1.questions.count } }

    private func fineprint(_ plan: Plan?) -> String {
        let price = store.plans.first { $0.id == .monthly }.map { " (\($0.priceString) per \($0.periodLabel ?? "month"))" } ?? ""
        return "Lifetime is a one-time purchase. The 1-Month Pass\(price) is an auto-renewing subscription: payment is charged to your Apple Account at confirmation of purchase, and it renews automatically each month at the same price unless cancelled at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the end of the period. Manage or cancel in your App Store account settings (Subscriptions)."
    }

    private func feature(_ glyph: String, _ tint: Color, _ text: String) -> some View {
        HStack(spacing: Space.sm) {
            Image(systemName: glyph).font(.system(size: 20)).foregroundStyle(tint).frame(width: 30)
            Text(text).font(.jost(.bold, 16)).foregroundStyle(c.ink)
        }
        .frame(minHeight: 32)
    }

    private func planRow(_ p: Plan, selected: Bool) -> some View {
        let fg: Color = selected ? (c.isGlass ? Color(hex: 0x141414) : c.paper) : c.ink
        return Button { self.selected = p.id } label: {
            HStack(spacing: Space.md) {
                Group {
                    if selected { Image(systemName: Glyph.check).font(.system(size: 22, weight: .bold)).foregroundStyle(c.yellow) }
                }
                .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: Space.sm) {
                        Text(p.id.name).font(.jost(.heavy, 18))
                        if let tag = p.id.tag {
                            Text(tag).font(.jost(.heavy, 10)).tracking(1.5).foregroundStyle(c.onYellow)
                                .padding(.horizontal, 6).padding(.vertical, 1).background(c.yellow)
                        }
                    }
                    Text(p.id.note).font(.jost(.medium, 13)).opacity(0.8)
                }
                Spacer()
                (Text(p.priceString).font(.jost(.black, 22))
                    + Text(p.periodLabel.map { " / \($0)" } ?? "").font(.jost(.medium, 12)))
            }
            .foregroundStyle(fg)
            .padding(Space.md)
            .frame(minHeight: 72)
            .background(selected ? c.ink : Color.clear)
            .overlay(Rectangle().strokeBorder(c.ink, lineWidth: RuleWeight.thick))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .accessibilityLabel("\(p.id.name), \(p.priceString)\(p.periodLabel.map { " per \($0)" } ?? ""). \(p.id.note)")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func linkButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.jost(.bold, 14)).underline().foregroundStyle(c.blue).frame(minHeight: Target.min)
        }
        .buttonStyle(.plain)
    }

    private func buy(_ plan: Plan) async {
        busy = "buy"
        message = nil
        let outcome = await store.purchase(plan, with: purchaseAction)
        busy = nil
        switch outcome {
        case .success: message = "Pro unlocked. Thank you!"
        case .cancelled: break
        case .pending: message = "Purchase pending approval."
        case .failed(let e): message = e
        }
    }

    private func restore() async {
        busy = "restore"
        message = nil
        let ok = await store.restore()
        busy = nil
        message = ok ? "Pro restored." : "No previous Pro purchase found for this account."
    }
}
