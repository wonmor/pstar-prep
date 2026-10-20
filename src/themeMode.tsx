// Theme preference (Black / Paper). Black is the default Bauhaus look.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { applyTheme, type ThemeMode } from './theme';

const KEY = 'pstar:theme:v1';

function queryTheme(): ThemeMode | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const t = new URLSearchParams(window.location.search).get('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; ready: boolean };
const ThemeContext = createContext<Ctx>({ mode: 'dark', setMode: () => {}, ready: true });

export function useThemeMode(): Ctx {
  return useContext(ThemeContext);
}

// Owns the preference. Applies the palette synchronously during render so the
// whole tree re-renders against the new colours in the same pass.
export function useThemeState(): Ctx {
  const forced = queryTheme();
  const [mode, setModeState] = useState<ThemeMode>(forced ?? 'dark');
  const [ready, setReady] = useState(forced != null);
  useEffect(() => {
    if (forced) return;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark') setModeState(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);
  applyTheme(mode);
  return { mode, setMode, ready };
}

export const ThemeModeProvider = ThemeContext.Provider;
