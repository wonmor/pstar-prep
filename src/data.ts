// Data layer: typed access to a parsed exam dataset + quiz helpers.
// The app supports more than one exam (PSTAR, ROC-A); each exam owns its own
// dataset. `makeExamApi` binds the helpers to one dataset so screens can read
// the active exam through the `useExam()` hook (see exam.tsx).

export type Question = {
  id: string;
  section: number;
  sectionName: string;
  question: string;
  options: string[];
  answer: number; // 1-based index of correct option
  reference: string;
};

export type Section = { id: number; name: string };

export type Dataset = {
  title: string;
  source: string;
  sections: Section[];
  questions: Question[];
};

// Fisher–Yates shuffle (returns a new array). Pure — not tied to any dataset.
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The option order shown to the user, with a map back to original indices so
// the correct answer can be tracked even when options are shuffled. Pure.
export type ShuffledOptions = { labels: string[]; correctIndex: number; order: number[] };

export function shuffleOptions(q: Question): ShuffledOptions {
  const order = shuffle(q.options.map((_, i) => i));
  const labels = order.map((i) => q.options[i]);
  const correctIndex = order.indexOf(q.answer - 1);
  return { labels, correctIndex, order };
}

// Everything a screen needs to render one exam, bound to that exam's dataset.
export type ExamApi = {
  QUESTIONS: Question[];
  SECTIONS: Section[];
  EXAM_SIZE: number;
  PASS_PCT: number;
  sectionName: (id: number) => string;
  questionsForSection: (id: number) => Question[];
  countForSection: (id: number) => number;
  // scope === 'exam' → EXAM_SIZE random across all sections.
  // scope === number  → all questions in that section (shuffled).
  buildQuiz: (scope: 'exam' | number) => Question[];
};

export function makeExamApi(input: {
  dataset: Dataset;
  examSize: number;
  passPct: number;
}): ExamApi {
  const QUESTIONS = input.dataset.questions;
  const SECTIONS = input.dataset.sections;
  const EXAM_SIZE = input.examSize;
  const PASS_PCT = input.passPct;

  const sectionName = (id: number): string =>
    SECTIONS.find((s) => s.id === id)?.name ?? `Section ${id}`;
  const questionsForSection = (id: number): Question[] =>
    QUESTIONS.filter((q) => q.section === id);
  const countForSection = (id: number): number => questionsForSection(id).length;
  const buildQuiz = (scope: 'exam' | number): Question[] =>
    scope === 'exam' ? shuffle(QUESTIONS).slice(0, EXAM_SIZE) : shuffle(questionsForSection(scope));

  return {
    QUESTIONS,
    SECTIONS,
    EXAM_SIZE,
    PASS_PCT,
    sectionName,
    questionsForSection,
    countForSection,
    buildQuiz,
  };
}
