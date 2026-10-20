// Entitlements: the single place that knows whether the user is Pro.
// Screens call `useEntitlements()` (isPro + purchase actions) and `useGate()`
// (exam-bound free/locked helpers). Store details live in purchases*.ts.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './purchases';
import type { Plan, PurchaseResult } from './purchases.types';
import {
  accessibleQuestions,
  canAccessSection,
  dayKey,
  freeSectionIds,
  lockedSectionCount,
  logMockStart,
  mocksRemaining,
  resolveIsPro,
} from './gating';
import { useExam } from './exam';
import type { ExamId } from './exams';
import type { Question } from './data';

const MOCK_KEY = 'pstar:mocks:v1';
const CACHE_KEY = 'pstar:pro:v1'; // last known entitlement, for instant offline start

function webQueryTier(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('tier');
  } catch {
    return null;
  }
}

const FORCE_PRO = process.env.EXPO_PUBLIC_FORCE_PRO === '1';

type MockLog = Partial<Record<ExamId, string[]>>;

type Ctx = {
  isPro: boolean;
  storeAvailable: boolean | null; // null while checking
  isWeb: boolean;
  plans: Plan[];
  loadingPlans: boolean;
  refreshPlans: () => Promise<void>;
  purchase: (plan: Plan) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  mockLog: MockLog;
  noteMockStart: (exam: ExamId) => void;
};

const EntitlementsContext = createContext<Ctx | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [entitled, setEntitled] = useState(false);
  const [storeAvailable, setStoreAvailable] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [mockLog, setMockLog] = useState<MockLog>({});
  const queryTier = useMemo(webQueryTier, []);

  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([CACHE_KEY, MOCK_KEY])
      .then(([[, pro], [, mocks]]) => {
        if (!alive) return;
        if (pro === '1') setEntitled(true);
        if (mocks) setMockLog(JSON.parse(mocks));
      })
      .catch(() => {});
    store.init().then(async (ok) => {
      if (!alive) return;
      setStoreAvailable(ok);
      if (ok) {
        const e = await store.isEntitled();
        if (alive) setEntitled(e);
      }
    });
    const off = store.onChange((e) => setEntitled(e));
    return () => {
      alive = false;
      off();
    };
  }, []);

  // Remember the last entitlement so Pro opens unlocked even when offline.
  useEffect(() => {
    if (storeAvailable) AsyncStorage.setItem(CACHE_KEY, entitled ? '1' : '0').catch(() => {});
  }, [entitled, storeAvailable]);

  const refreshPlans = useCallback(async () => {
    setLoadingPlans(true);
    const p = await store.getPlans();
    setPlans(p);
    setLoadingPlans(false);
  }, []);

  const purchase = useCallback(async (plan: Plan) => {
    const r = await store.purchase(plan);
    if (r.entitled) setEntitled(true);
    return r;
  }, []);

  const restore = useCallback(async () => {
    const e = await store.restore();
    setEntitled(e);
    return e;
  }, []);

  const noteMockStart = useCallback((exam: ExamId) => {
    setMockLog((log) => {
      const next = { ...log, [exam]: logMockStart(log[exam] ?? [], dayKey(new Date())) };
      AsyncStorage.setItem(MOCK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isPro = resolveIsPro({ platform: Platform.OS, forcePro: FORCE_PRO, queryTier, entitled });

  const value = useMemo<Ctx>(
    () => ({
      isPro,
      storeAvailable,
      isWeb: Platform.OS === 'web',
      plans,
      loadingPlans,
      refreshPlans,
      purchase,
      restore,
      mockLog,
      noteMockStart,
    }),
    [isPro, storeAvailable, plans, loadingPlans, refreshPlans, purchase, restore, mockLog, noteMockStart],
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): Ctx {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements outside EntitlementsProvider');
  return ctx;
}

// Exam-bound gating helpers for screens.
export function useGate() {
  const { isPro, mockLog, noteMockStart } = useEntitlements();
  const { id, SECTIONS, QUESTIONS } = useExam();
  return useMemo(() => {
    const today = dayKey(new Date());
    const remaining = mocksRemaining(isPro, mockLog[id] ?? [], today);
    return {
      isPro,
      freeSections: freeSectionIds(SECTIONS),
      lockedCount: lockedSectionCount(isPro, SECTIONS),
      canSection: (sectionId: number) => canAccessSection(isPro, SECTIONS, sectionId),
      visible: (qs: Question[] = QUESTIONS) => accessibleQuestions(isPro, SECTIONS, qs),
      mocksLeft: remaining,
      canMock: remaining > 0,
      noteMock: () => {
        if (!isPro) noteMockStart(id);
      },
    };
  }, [isPro, mockLog, noteMockStart, id, SECTIONS, QUESTIONS]);
}
