// Bauhaus design tokens.
// Flat primaries, a black (default) or off-white ground, heavy geometric type
// (Jost — a Futura-like grotesk). No gradients, no soft shadows, no rounded
// cards: structure comes from a strict grid, thick rules and typographic glyphs.
// Every text/background pair is ≥ 4.5:1 (WCAG AA) in both modes.
// Two Bauhaus palettes that share token names. `paper` is always the ground
// and `ink` the foreground, so a block "inverted to ink" works in both.
// Black is the default; "Paper" (off-white) is selectable in About.
export type ThemeMode = 'dark' | 'light';

const light = {
  paper: '#F3EEE3', // off-white ground
  paperDeep: '#E8E1D2', // pressed / inset ground
  ink: '#141414', // black — text + rules
  inkSoft: '#5B574F', // secondary text (6.2:1 on paper)
  red: '#C8231B', // 4.9:1 on paper; carries onAccent text at 5.7:1
  blue: '#1D4E9E', // 6.9:1 on paper; onAccent 8.0:1
  yellow: '#F2C230', // only behind onYellow text (11:1) or as a decorative glyph
  onAccent: '#FFFFFF', // text on red / blue fills
  onYellow: '#141414', // text on yellow, both modes
  white: '#FFFFFF',
  backdrop: 'rgba(20,20,20,0.72)',
};

const dark: typeof light = {
  paper: '#121212', // black ground
  paperDeep: '#2A2A2A',
  ink: '#F3EEE3', // off-white foreground (16:1)
  inkSoft: '#B3AC9E', // 8.3:1
  red: '#FF5B47', // 6.1:1 on black, black text on it 6.1:1
  blue: '#6E9BEA', // 6.7:1
  yellow: '#F2C230', // 11:1
  onAccent: '#121212',
  onYellow: '#141414',
  white: '#FFFFFF',
  backdrop: 'rgba(0,0,0,0.78)',
};

// Mutable: `applyTheme` swaps the values in place, then the app re-renders.
export const colors = { ...dark };
let themeVersion = 0;
let currentMode: ThemeMode = 'dark';

export function applyTheme(mode: ThemeMode) {
  if (mode === currentMode) return;
  currentMode = mode;
  Object.assign(colors, mode === 'dark' ? dark : light);
  themeVersion++;
}
export const themeMode = () => currentMode;

// Lazily-built, theme-aware style objects: `themed(() => StyleSheet.create({...}))`
// re-runs the factory after a theme switch, so module-level styles follow it.
export function themed<T extends object>(factory: () => T): T {
  let cache: T | null = null;
  let builtFor = -1;
  return new Proxy({} as T, {
    get(_t, key) {
      if (builtFor !== themeVersion || !cache) {
        cache = factory();
        builtFor = themeVersion;
      }
      return (cache as any)[key];
    },
  });
}

// Jost weights loaded in App.tsx. With custom fonts React Native ignores
// `fontWeight` on Android, so each weight is its own family.
export const fonts = {
  regular: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  bold: 'Jost_700Bold',
  heavy: 'Jost_800ExtraBold',
  black: 'Jost_900Black',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Rule weights — the Bauhaus "thick line" vocabulary.
export const rule = { hair: 1, mid: 2, thick: 4, heavy: 8 };

// Minimum touch target (Apple HIG / Material).
export const TOUCH = 44;

// Typographic glyphs used instead of drawn shapes. ︎ forces text (not
// emoji) presentation where a platform might otherwise swap in a colour emoji.
export const glyph = {
  circle: '●',
  square: '■',
  triangle: '▲',
  arrow: '→',
  back: '←',
  close: '✕',
  check: '✓',
  star: '★︎',
  starOpen: '☆︎',
  lock: '■', // locked content is marked with a solid square + the word LOCKED
  open: '□',
  plus: '+',
  dot: '·',
  slash: '/',
  diamond: '◆',
  refresh: '↺',
};

export const type = themed(() => ({
  display: { fontFamily: fonts.black, fontSize: 56, lineHeight: 56, color: colors.ink, letterSpacing: -1.5 },
  h1: { fontFamily: fonts.black, fontSize: 34, lineHeight: 36, color: colors.ink, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 26, color: colors.ink, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, color: colors.ink },
  mute: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    color: colors.ink,
    textTransform: 'uppercase' as const,
  },
  tiny: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.5, color: colors.inkSoft },
}));

// Back-compat name used by older imports.
export const font = type;
