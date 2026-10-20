// iOS / Android store adapter backed by RevenueCat (react-native-purchases).
// Needs a native build (EAS dev client or store build) — in Expo Go or without
// an API key it reports "unavailable" and the app stays on the free tier.
//
// Keys are public SDK keys ("appl_…" / "goog_…") read from
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { ENTITLEMENT_ID, PRODUCT_IDS, type Plan, type PlanId, type StoreAdapter } from './purchases.types';

type RC = typeof import('react-native-purchases').default;

let rc: RC | null = null;
let ready: Promise<boolean> | null = null;

const entitled = (info: CustomerInfo | null | undefined) => !!info?.entitlements?.active?.[ENTITLEMENT_ID];

function apiKey(): string | undefined {
  const k =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  return k && k.trim() ? k.trim() : undefined;
}

function planIdFor(pkg: PurchasesPackage): PlanId | null {
  const pid = pkg.product.identifier;
  // Android subscription ids may come back as "productId:basePlanId".
  if (pid === PRODUCT_IDS.lifetime || pkg.packageType === 'LIFETIME') return 'lifetime';
  if (pid.split(':')[0] === PRODUCT_IDS.monthly || pkg.packageType === 'MONTHLY') return 'monthly';
  return null;
}

async function doInit(): Promise<boolean> {
  const key = apiKey();
  if (!key) return false;
  try {
    const mod = await import('react-native-purchases');
    rc = mod.default;
    rc.configure({ apiKey: key });
    return true;
  } catch {
    rc = null;
    return false;
  }
}

export const store: StoreAdapter = {
  init: () => (ready ??= doInit()),

  isEntitled: async () => {
    if (!(await store.init()) || !rc) return false;
    try {
      return entitled(await rc.getCustomerInfo());
    } catch {
      return false;
    }
  },

  getPlans: async () => {
    if (!(await store.init()) || !rc) return [];
    try {
      const offerings = await rc.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      const plans: Plan[] = [];
      for (const pkg of pkgs) {
        const id = planIdFor(pkg);
        if (!id || plans.some((p) => p.id === id)) continue;
        plans.push({
          id,
          productId: pkg.product.identifier,
          priceString: pkg.product.priceString,
          title: pkg.product.title,
          handle: pkg,
        });
      }
      const rank = (p: Plan) => (p.id === 'lifetime' ? 0 : 1);
      return plans.sort((a, b) => rank(a) - rank(b));
    } catch {
      return [];
    }
  },

  purchase: async (plan) => {
    if (!(await store.init()) || !rc)
      return { entitled: false, cancelled: false, error: 'Store unavailable.' };
    try {
      const res = await rc.purchasePackage(plan.handle as PurchasesPackage);
      return { entitled: entitled(res.customerInfo), cancelled: false };
    } catch (e: any) {
      if (e?.userCancelled) return { entitled: false, cancelled: true };
      return { entitled: false, cancelled: false, error: e?.message ?? 'Purchase failed.' };
    }
  },

  restore: async () => {
    if (!(await store.init()) || !rc) return false;
    try {
      return entitled(await rc.restorePurchases());
    } catch {
      return false;
    }
  },

  onChange: (cb) => {
    let alive = true;
    const listener = (info: CustomerInfo) => alive && cb(entitled(info));
    store.init().then((ok) => {
      if (ok && rc && alive) rc.addCustomerInfoUpdateListener(listener);
    });
    return () => {
      alive = false;
      rc?.removeCustomerInfoUpdateListener(listener);
    };
  },
};
