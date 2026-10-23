// Store adapter contract. `purchases.ts` (iOS/Android, RevenueCat) and
// `purchases.web.ts` (no-op) both implement it, so the rest of the app only
// ever deals with plans and a boolean entitlement.

export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_IDS = {
  lifetime: 'pstar_pro_lifetime',
  monthly: 'pstar_pro_1month',
} as const;
// App Store product ids are unique per developer account and
// 'pstar_pro_lifetime' was already taken there, so the iOS lifetime product
// uses this id. Play keeps PRODUCT_IDS.lifetime.
export const IOS_LIFETIME_PRODUCT_ID = 'pstar_pro_lifetime_ios';

export type PlanId = keyof typeof PRODUCT_IDS;

export type Plan = {
  id: PlanId;
  productId: string;
  priceString: string; // localized, from the store
  title: string;
  // Opaque store package handed back to `purchase`.
  handle: unknown;
};

export type PurchaseResult = { entitled: boolean; cancelled: boolean; error?: string };

export type StoreAdapter = {
  // false when there is no API key, no native module (Expo Go/web) or init failed.
  init: () => Promise<boolean>;
  isEntitled: () => Promise<boolean>;
  getPlans: () => Promise<Plan[]>;
  purchase: (plan: Plan) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  onChange: (cb: (entitled: boolean) => void) => () => void;
};
