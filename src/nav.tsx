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
    }
  | { name: 'cardsSetup' }
  | { name: 'cards'; scope: 'all' | 'bookmarks' | number }
  | { name: 'review'; initialSection?: number | 'bookmarks' }
  | { name: 'about' };

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

// Which tab "owns" a given route (controls tab-bar highlight).
export function tabForRoute(r: Route): TabKey {
  switch (r.name) {
    case 'home':
      return 'home';
    case 'quizSetup':
    case 'quiz':
    case 'results':
      return 'quizSetup';
    case 'cardsSetup':
    case 'cards':
      return 'cardsSetup';
    case 'review':
      return 'review';
    case 'about':
      return 'about';
  }
}
