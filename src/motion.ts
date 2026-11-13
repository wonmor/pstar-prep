// Reduced-motion preference. Native: AccessibilityInfo (Reduce Motion in iOS
// Settings, "Remove animations" on Android). Web: the prefers-reduced-motion
// media query. Every animation in the app checks this and falls back to an
// instant state change.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

function webQuery(): MediaQueryList | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return null;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)');
  } catch {
    return null;
  }
}

let current = webQuery()?.matches ?? false;
const listeners = new Set<(v: boolean) => void>();
function set(v: boolean) {
  if (v === current) return;
  current = v;
  listeners.forEach((l) => l(v));
}

if (Platform.OS === 'web') {
  const q = webQuery();
  q?.addEventListener?.('change', (e) => set(e.matches));
} else {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => set(!!v))
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => set(!!v));
}

export function reducedMotion(): boolean {
  return current;
}

export function useReducedMotion(): boolean {
  const [v, setV] = useState(current);
  useEffect(() => {
    listeners.add(setV);
    setV(current);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

// Duration helper: 0 when motion is reduced so Animated.timing completes
// in the same frame.
export function dur(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}
