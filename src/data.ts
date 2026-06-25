// Data layer: typed access to the parsed PSTAR dataset + quiz helpers.
import raw from '../assets/data/pstar.json';

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

export const dataset = raw as Dataset;
export const QUESTIONS: Question[] = dataset.questions;
export const SECTIONS: Section[] = dataset.sections;

// Real PSTAR exams draw 50 questions; pass mark is 90%.
export const EXAM_SIZE = 50;
export const PASS_PCT = 90;

export function sectionName(id: number): string {
  return SECTIONS.find((s) => s.id === id)?.name ?? `Section ${id}`;
}

export function questionsForSection(id: number): Question[] {
  return QUESTIONS.filter((q) => q.section === id);
}

export function countForSection(id: number): number {
  return questionsForSection(id).length;
}

// Fisher–Yates shuffle (returns a new array).
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a quiz set. scope === 'exam' → 50 random across all sections.
// scope === number → all questions in that section (shuffled).
export function buildQuiz(scope: 'exam' | number): Question[] {
  if (scope === 'exam') return shuffle(QUESTIONS).slice(0, EXAM_SIZE);
  return shuffle(questionsForSection(scope));
}

// The option order shown to the user, with a map back to original indices so
// the correct answer can be tracked even when options are shuffled.
export type ShuffledOptions = { labels: string[]; correctIndex: number; order: number[] };

export function shuffleOptions(q: Question): ShuffledOptions {
  const order = shuffle(q.options.map((_, i) => i));
  const labels = order.map((i) => q.options[i]);
  const correctIndex = order.indexOf(q.answer - 1);
  return { labels, correctIndex, order };
}
