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
};

const EMPTY: Progress = {
  stats: {},
  bookmarks: [],
  known: [],
  bestExamPct: null,
  examsTaken: 0,
};

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
  await persist(exam, { ...p, stats });
}

export async function recordExam(exam: ExamId, pct: number) {
  const p = await load(exam);
  await persist(exam, {
    ...p,
    examsTaken: p.examsTaken + 1,
    bestExamPct: p.bestExamPct == null ? pct : Math.max(p.bestExamPct, pct),
  });
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
    recordExam: useCallback((pct: number) => recordExam(exam, pct), [exam]),
    toggleBookmark: useCallback((id: string) => toggleBookmark(exam, id), [exam]),
    setKnown: useCallback((id: string, known: boolean) => setKnown(exam, id, known), [exam]),
    resetProgress: useCallback(() => resetProgress(exam), [exam]),
  };
}
