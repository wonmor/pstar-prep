// Pro entitlement via StoreKit 2. Entitlement = an active `pstar_pro_1month`
// subscription OR the `pstar_pro_lifetime_ios` non-consumable. The last known
// state is cached so Pro opens unlocked offline.
import Foundation
import StoreKit
import SwiftUI

enum PlanID: String, CaseIterable, Identifiable {
    case lifetime, monthly
    var id: String { rawValue }

    var productID: String {
        switch self {
        case .lifetime: return ProStore.lifetimeID
        case .monthly: return ProStore.monthlyID
        }
    }

    var name: String { self == .lifetime ? "Lifetime" : "1-Month Pass" }
    var note: String { self == .lifetime ? "Pay once, yours forever" : "Renews monthly, cancel anytime" }
    var tag: String? { self == .lifetime ? "BEST VALUE" : nil }
}

struct Plan: Identifiable {
    let id: PlanID
    let priceString: String
    let periodLabel: String? // "month" for the subscription
    let product: Product?    // nil only for the debug demo catalogue
}

@MainActor
final class ProStore: ObservableObject {
    static let monthlyID = "pstar_pro_1month"
    static let lifetimeID = "pstar_pro_lifetime_ios"
    static let productIDs: Set<String> = [monthlyID, lifetimeID]
    private static let cacheKey = "pstar:pro:v1"

    enum LoadState: Equatable { case idle, loading, ready, unavailable }

    @Published private(set) var entitled: Bool
    @Published private(set) var plans: [Plan] = []
    @Published private(set) var loadState: LoadState = .idle
    @Published private(set) var forcePro = false

    private var updates: Task<Void, Never>?

    var isPro: Bool { Gating.resolveIsPro(entitled: entitled, forcePro: forcePro) }

    init() {
        entitled = UserDefaults.standard.string(forKey: Self.cacheKey) == "1"
        #if DEBUG
        forcePro = UserDefaults.standard.bool(forKey: "QAForcePro")
        if UserDefaults.standard.bool(forKey: "QAFree") { entitled = false }
        #endif
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let t) = result { await t.finish() }
                await self?.refreshEntitlement()
            }
        }
        Task { await refreshEntitlement() }
    }

    deinit { updates?.cancel() }

    func refreshEntitlement() async {
        var active = false
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result else { continue }
            if Self.productIDs.contains(t.productID), t.revocationDate == nil {
                if let exp = t.expirationDate, exp < Date() { continue }
                active = true
            }
        }
        #if DEBUG
        if UserDefaults.standard.bool(forKey: "QAFree") { active = false }
        #endif
        entitled = active
        UserDefaults.standard.set(active ? "1" : "0", forKey: Self.cacheKey)
    }

    func loadPlans() async {
        #if DEBUG
        // QA only, like the web build's ?store=demo: a fake catalogue so the
        // paywall can be previewed; it can never grant Pro.
        if UserDefaults.standard.bool(forKey: "QADemoStore") {
            plans = [
                Plan(id: .lifetime, priceString: "$9.99", periodLabel: nil, product: nil),
                Plan(id: .monthly, priceString: "$4.99", periodLabel: "month", product: nil),
            ]
            loadState = .ready
            return
        }
        #endif
        loadState = .loading
        do {
            let products = try await Product.products(for: Self.productIDs)
            var out: [Plan] = []
            for id in PlanID.allCases {
                guard let p = products.first(where: { $0.id == id.productID }) else { continue }
                out.append(Plan(id: id, priceString: p.displayPrice, periodLabel: Self.periodLabel(p), product: p))
            }
            plans = out
            loadState = out.isEmpty ? .unavailable : .ready
        } catch {
            plans = []
            loadState = .unavailable
        }
    }

    private static func periodLabel(_ p: Product) -> String? {
        guard let period = p.subscription?.subscriptionPeriod else { return nil }
        let unit: String
        switch period.unit {
        case .day: unit = "day"
        case .week: unit = "week"
        case .month: unit = "month"
        case .year: unit = "year"
        @unknown default: unit = "period"
        }
        return period.value == 1 ? unit : "\(period.value) \(unit)s"
    }

    enum Outcome { case success, cancelled, pending, failed(String) }

    /// Purchases go through SwiftUI's `PurchaseAction` so StoreKit can present
    /// its sheet in the right window/scene on macOS and visionOS.
    func purchase(_ plan: Plan, with action: PurchaseAction) async -> Outcome {
        guard let product = plan.product else { return .failed("Demo catalogue: purchases are disabled.") }
        do {
            switch try await action(product) {
            case .success(let verification):
                guard case .verified(let t) = verification else { return .failed("The purchase could not be verified.") }
                await t.finish()
                await refreshEntitlement()
                return entitled ? .success : .failed("Purchase did not complete.")
            case .userCancelled: return .cancelled
            case .pending: return .pending
            @unknown default: return .failed("Purchase did not complete.")
            }
        } catch {
            return .failed(error.localizedDescription)
        }
    }

    func restore() async -> Bool {
        try? await AppStore.sync()
        await refreshEntitlement()
        return entitled
    }
}
