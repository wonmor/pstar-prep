// Web build: no in-app payments — Pro is free on the web (see gating.resolveIsPro).
// `?store=demo` swaps in a fake catalogue so the paywall can be previewed and
// screenshotted in a browser; it can never grant Pro.
import type { Plan, StoreAdapter } from './purchases.types';
import { PRODUCT_IDS } from './purchases.types';

function demo(): boolean {
  try {
    return (
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('store') === 'demo'
    );
  } catch {
    return false;
  }
}

const DEMO_PLANS: Plan[] = [
  {
    id: 'lifetime',
    productId: PRODUCT_IDS.lifetime,
    priceString: '$9.99',
    title: 'Pro Lifetime',
    handle: null,
  },
  { id: 'monthly', productId: PRODUCT_IDS.monthly, priceString: '$4.99', title: 'Pro 1-Month', handle: null },
];

export const store: StoreAdapter = {
  init: async () => demo(),
  isEntitled: async () => false,
  getPlans: async () => (demo() ? DEMO_PLANS : []),
  purchase: async () => ({
    entitled: false,
    cancelled: false,
    error: 'Purchases are only available in the iOS and Android app.',
  }),
  restore: async () => false,
  onChange: () => () => {},
};
