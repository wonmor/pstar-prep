// Persistence layer for progress, per-section stats, and bookmarks.
// Progress is kept independently for each exam (PSTAR / ROC-A) so switching
// exams never mixes scores or bookmarks.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useExamId } from './exam';
import type { ExamId } from './exams';

// PSTAR keeps the original (unsuffixed) key so existing progress survives;
// other exams are namespaced by id.
function keyFor(exam: ExamId): string {
  return exam === 'pstar' ? 'pstar:progress:v1' : `pstar:progress:v1:${exam}`;
}

export type QStat = { seen: number; correct: number; lastCorrect: boolean | null };

export type Progress = {
  // per-question stats keyed by question id
  stats: Record<string, QStat>;
  // bookmarked question ids
  bookmarks: string[];
  // known flashcard ids (marked "Got it")
  known: string[];
  // best exam score (percent) and number of exams completed
  bestExamPct: number | null;
  examsTaken: number;
  // study activity: answers recorded per local calendar day ("2026-11-13")
  activity: Record<string, number>;
  // mock exam history, oldest first (kept to the last 30)
  examHistory: { day: string; pct: number; seconds?: number }[];
  // spot-it results keyed by illustration id: last attempt correct?
  spots: Record<string, boolean>;
};

const EMPTY: Progress = {
  stats: {},
  bookmarks: [],
  known: [],
  bestExamPct: null,
  examsTaken: 0,
  activity: {},
  examHistory: [],
  spots: {},
};

// Local calendar day key, e.g. "2026-11-13" (device time zone).
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Trim the activity log to the last ~400 days so storage stays small.
function trimActivity(a: Record<string, number>): Record<string, number> {
  const keys = Object.keys(a).sort();
  if (keys.length <= 400) return a;
  const keep = keys.slice(-400);
  const out: Record<string, number> = {};
  for (const k of keep) out[k] = a[k];
  return out;
}

const caches: Partial<Record<ExamId, Progress>> = {};
const listenerMap: Partial<Record<ExamId, Set<(p: Progress) => void>>> = {};

function listenersFor(exam: ExamId): Set<(p: Progress) => void> {
  return (listenerMap[exam] ??= new Set());
}

async function load(exam: ExamId): Promise<Progress> {
  const cached = caches[exam];
  if (cached) return cached;
  let next: Progress;
  try {
    const raw = await AsyncStorage.getItem(keyFor(exam));
    next = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    next = { ...EMPTY };
  }
  caches[exam] = next;
  return next;
}

async function persist(exam: ExamId, next: Progress) {
  caches[exam] = next;
  listenersFor(exam).forEach((l) => l(next));
  try {
    await AsyncStorage.setItem(keyFor(exam), JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

export async function recordAnswer(exam: ExamId, id: string, correct: boolean) {
  const p = await load(exam);
  const prev = p.stats[id] ?? { seen: 0, correct: 0, lastCorrect: null };
  const stats = {
    ...p.stats,
    [id]: {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      lastCorrect: correct,
    },
  };
  const day = todayKey();
  const activity = trimActivity({ ...p.activity, [day]: (p.activity?.[day] ?? 0) + 1 });
  await persist(exam, { ...p, stats, activity });
}

export async function recordExam(exam: ExamId, pct: number, seconds?: number) {
  const p = await load(exam);
  const examHistory = [...(p.examHistory ?? []), { day: todayKey(), pct, seconds }].slice(-30);
  await persist(exam, {
    ...p,
    examsTaken: p.examsTaken + 1,
    bestExamPct: p.bestExamPct == null ? pct : Math.max(p.bestExamPct, pct),
    examHistory,
  });
}

export async function recordSpot(exam: ExamId, illustrationId: string, correct: boolean) {
  const p = await load(exam);
  const day = todayKey();
  const activity = trimActivity({ ...p.activity, [day]: (p.activity?.[day] ?? 0) + 1 });
  await persist(exam, { ...p, spots: { ...(p.spots ?? {}), [illustrationId]: correct }, activity });
}

// Consecutive study days ending today (or yesterday, so an evening session
// does not break the streak before the day is over).
export function streakDays(activity: Record<string, number>, now = new Date()): number {
  const has = (d: Date) => (activity[todayKey(d)] ?? 0) > 0;
  const d = new Date(now);
  if (!has(d)) {
    d.setDate(d.getDate() - 1);
    if (!has(d)) return 0;
  }
  let n = 0;
  while (has(d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export async function toggleBookmark(exam: ExamId, id: string) {
  const p = await load(exam);
  const has = p.bookmarks.includes(id);
  const bookmarks = has ? p.bookmarks.filter((x) => x !== id) : [...p.bookmarks, id];
  await persist(exam, { ...p, bookmarks });
}

export async function setKnown(exam: ExamId, id: string, known: boolean) {
  const p = await load(exam);
  const has = p.known.includes(id);
  if (known === has) return;
  const list = known ? [...p.known, id] : p.known.filter((x) => x !== id);
  await persist(exam, { ...p, known: list });
}

export async function resetProgress(exam: ExamId) {
  await persist(exam, { ...EMPTY });
}

// --- One-time disclaimer acknowledgement (separate key, shared across exams) ---
const DISCLAIMER_KEY = 'pstar:disclaimer:v1';

export function useDisclaimerGate() {
  // 'loading' until we know; then true/false.
  const [accepted, setAccepted] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DISCLAIMER_KEY)
      .then((v) => active && setAccepted(v === '1'))
      .catch(() => active && setAccepted(false));
    return () => {
      active = false;
    };
  }, []);
  const accept = useCallback(() => {
    setAccepted(true);
    AsyncStorage.setItem(DISCLAIMER_KEY, '1').catch(() => {});
  }, []);
  return { accepted, accept };
}

// React hook: subscribe to the active exam's progress state.
export function useProgress(): Progress {
  const exam = useExamId();
  const [state, setState] = useState<Progress>(caches[exam] ?? EMPTY);
  useEffect(() => {
    let active = true;
    setState(caches[exam] ?? EMPTY);
    load(exam).then((p) => active && setState(p));
    const l = (p: Progress) => setState(p);
    listenersFor(exam).add(l);
    return () => {
      active = false;
      listenersFor(exam).delete(l);
    };
  }, [exam]);
  return state;
}

// Actions bound to the active exam.
export function useActions() {
  const exam = useExamId();
  return {
    recordAnswer: useCallback((id: string, correct: boolean) => recordAnswer(exam, id, correct), [exam]),
    recordExam: useCallback((pct: number, seconds?: number) => recordExam(exam, pct, seconds), [exam]),
    recordSpot: useCallback((id: string, correct: boolean) => recordSpot(exam, id, correct), [exam]),
    toggleBookmark: useCallback((id: string) => toggleBookmark(exam, id), [exam]),
    setKnown: useCallback((id: string, known: boolean) => setKnown(exam, id, known), [exam]),
    resetProgress: useCallback(() => resetProgress(exam), [exam]),
  };
}
