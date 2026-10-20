// Free vs Pro rules. Pure functions only (no React, no storage, no imports with
// runtime values) so they can be unit-tested with `node --test`.
//
// Free tier (per exam):
//   · the first FREE_SECTION_COUNT sections in practice, flashcards and the answer key
//   · FREE_MOCKS_PER_DAY full mock exam(s) per calendar day
// Pro (one "pro" entitlement, covers both PSTAR and ROC-A):
//   · every section, unlimited mock exams
//
// Bookmarks and progress are never gated — a free user keeps everything they saved.

export const FREE_SECTION_COUNT = 3;
export const FREE_MOCKS_PER_DAY = 1;

export type SectionLike = { id: number };
export type QuestionLike = { section: number };

// Section ids that are free, in the dataset's own display order.
export function freeSectionIds(sections: readonly SectionLike[]): Set<number> {
  return new Set(sections.slice(0, FREE_SECTION_COUNT).map((s) => s.id));
}

export function canAccessSection(
  isPro: boolean,
  sections: readonly SectionLike[],
  sectionId: number,
): boolean {
  return isPro || freeSectionIds(sections).has(sectionId);
}

export function canAccessQuestion(
  isPro: boolean,
  sections: readonly SectionLike[],
  q: QuestionLike,
): boolean {
  return canAccessSection(isPro, sections, q.section);
}

export function accessibleQuestions<Q extends QuestionLike>(
  isPro: boolean,
  sections: readonly SectionLike[],
  questions: readonly Q[],
): Q[] {
  if (isPro) return questions.slice();
  const free = freeSectionIds(sections);
  return questions.filter((q) => free.has(q.section));
}

export function lockedSectionCount(isPro: boolean, sections: readonly SectionLike[]): number {
  return isPro ? 0 : Math.max(0, sections.length - FREE_SECTION_COUNT);
}

// Local calendar day, e.g. "2026-10-20". Uses the device time zone so the
// daily mock resets at the user's midnight.
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// How many mock exams the user can still start today (Infinity for Pro).
export function mocksRemaining(isPro: boolean, startedDays: readonly string[], today: string): number {
  if (isPro) return Infinity;
  const used = startedDays.filter((d) => d === today).length;
  return Math.max(0, FREE_MOCKS_PER_DAY - used);
}

export function canStartMock(isPro: boolean, startedDays: readonly string[], today: string): boolean {
  return mocksRemaining(isPro, startedDays, today) > 0;
}

// Record a mock start, keeping only the last few days so storage stays tiny.
export function logMockStart(startedDays: readonly string[], today: string, keep = 14): string[] {
  return [...startedDays, today].slice(-keep);
}

// Routes that need a check before they are shown.
export type GatedRoute =
  | { name: 'quiz'; scope: 'exam' | number }
  | { name: 'cards'; scope: 'all' | 'bookmarks' | number }
  | { name: string; scope?: unknown };

// Is a route viewable right now? Mock exams are metered at start time (see
// canStartMock), so here only section-scoped routes are checked.
export function routeAllowed(isPro: boolean, sections: readonly SectionLike[], route: GatedRoute): boolean {
  if ((route.name === 'quiz' || route.name === 'cards') && typeof route.scope === 'number') {
    return canAccessSection(isPro, sections, route.scope);
  }
  return true;
}

// Which tier applies. Web is a free promotional build (no store payments on
// the web), so it is Pro unless the page is opened with ?tier=free to preview
// the native free tier. A dev/test override (EXPO_PUBLIC_FORCE_PRO=1 or
// ?tier=pro) forces Pro for screenshots and QA builds.
export type TierInput = {
  platform: 'ios' | 'android' | 'web' | string;
  forcePro?: boolean;
  queryTier?: string | null; // web only: "free" | "pro"
  entitled: boolean; // RevenueCat "pro" entitlement active
};

export function resolveIsPro(t: TierInput): boolean {
  if (t.queryTier === 'pro') return true;
  if (t.queryTier === 'free') return t.entitled;
  if (t.forcePro) return true;
  if (t.platform === 'web') return true;
  return t.entitled;
}
