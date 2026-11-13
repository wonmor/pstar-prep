// Tiny stack-based navigator (no external nav dependency → reliable on web + native).
import React, { createContext, useContext } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'quizSetup' }
  | { name: 'quiz'; scope: 'exam' | number }
  | {
      name: 'results';
      scope: 'exam' | number;
      correct: number;
      total: number;
      isExam: boolean;
      wrongIds: string[];
      ids?: string[]; // every question id in the run, for the per-section breakdown
      seconds?: number; // time taken
    }
  | { name: 'cardsSetup' }
  | { name: 'cards'; scope: 'all' | 'bookmarks' | 'visual' | number }
  | { name: 'spot' }
  | { name: 'progress' }
  | { name: 'review'; initialSection?: number | 'bookmarks' }
  | { name: 'about' }
  | { name: 'paywall'; reason?: string };

export type TabKey = 'home' | 'quizSetup' | 'cardsSetup' | 'review' | 'about';

type NavApi = {
  current: Route;
  tab: TabKey;
  push: (r: Route) => void;
  back: () => void;
  resetTab: (t: TabKey) => void;
  canGoBack: boolean;
};

export const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav outside provider');
  return ctx;
}

export const TAB_ROOT: Record<TabKey, Route> = {
  home: { name: 'home' },
  quizSetup: { name: 'quizSetup' },
  cardsSetup: { name: 'cardsSetup' },
  review: { name: 'review' },
  about: { name: 'about' },
};

// Which tab "owns" a given route (controls tab-bar highlight). `null` means
// "push onto whichever tab is active" (the paywall can open from anywhere).
export function tabForRoute(r: Route): TabKey | null {
  switch (r.name) {
    case 'home':
    case 'progress':
      return 'home';
    case 'quizSetup':
    case 'quiz':
    case 'results':
    case 'spot':
      return 'quizSetup';
    case 'cardsSetup':
    case 'cards':
      return 'cardsSetup';
    case 'review':
      return 'review';
    case 'about':
      return 'about';
    case 'paywall':
      return null;
  }
}
