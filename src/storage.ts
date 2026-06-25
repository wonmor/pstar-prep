// Persistence layer for progress, per-section stats, and bookmarks.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'pstar:progress:v1';

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
};

const EMPTY: Progress = {
  stats: {},
  bookmarks: [],
  known: [],
  bestExamPct: null,
  examsTaken: 0,
};

let cache: Progress | null = null;
const listeners = new Set<(p: Progress) => void>();

async function load(): Promise<Progress> {
  if (cache) return cache;
  let next: Progress;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    next = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    next = { ...EMPTY };
  }
  cache = next;
  return next;
}

async function persist(next: Progress) {
  cache = next;
  listeners.forEach((l) => l(next));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

export async function recordAnswer(id: string, correct: boolean) {
  const p = await load();
  const prev = p.stats[id] ?? { seen: 0, correct: 0, lastCorrect: null };
  const stats = {
    ...p.stats,
    [id]: {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      lastCorrect: correct,
    },
  };
  await persist({ ...p, stats });
}

export async function recordExam(pct: number) {
  const p = await load();
  await persist({
    ...p,
    examsTaken: p.examsTaken + 1,
    bestExamPct: p.bestExamPct == null ? pct : Math.max(p.bestExamPct, pct),
  });
}

export async function toggleBookmark(id: string) {
  const p = await load();
  const has = p.bookmarks.includes(id);
  const bookmarks = has ? p.bookmarks.filter((x) => x !== id) : [...p.bookmarks, id];
  await persist({ ...p, bookmarks });
}

export async function setKnown(id: string, known: boolean) {
  const p = await load();
  const has = p.known.includes(id);
  if (known === has) return;
  const list = known ? [...p.known, id] : p.known.filter((x) => x !== id);
  await persist({ ...p, known: list });
}

export async function resetProgress() {
  await persist({ ...EMPTY });
}

// --- One-time disclaimer acknowledgement (separate key from progress) ---
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

// React hook: subscribe to progress state.
export function useProgress(): Progress {
  const [state, setState] = useState<Progress>(cache ?? EMPTY);
  useEffect(() => {
    let active = true;
    load().then((p) => active && setState(p));
    const l = (p: Progress) => setState(p);
    listeners.add(l);
    return () => {
      active = false;
      listeners.delete(l);
    };
  }, []);
  return state;
}

export function useActions() {
  return {
    recordAnswer: useCallback(recordAnswer, []),
    recordExam: useCallback(recordExam, []),
    toggleBookmark: useCallback(toggleBookmark, []),
    setKnown: useCallback(setKnown, []),
    resetProgress: useCallback(resetProgress, []),
  };
}
