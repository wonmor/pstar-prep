// Paper & ink design tokens.
// The app reads like a printed study guide: a warm off-white sheet, ink-dark
// type, faint ruled lines, "printed card" surfaces that sit a shade lighter
// than the page, and a muted trio of printing inks (brick, indigo, ochre) for
// accents. A faint paper grain tile is laid over every screen (App.tsx).
// Paper (light) is the default; "Night paper" is a warm dark variant that can
// be chosen in About. Every text/background pair is >= 4.5:1 (WCAG AA) in both.
export type ThemeMode = 'dark' | 'light';

const light = {
  paper: '#F4EDDD', // the sheet
  paperDeep: '#E9E0CB', // pressed / inset ground
  card: '#FBF6EA', // printed card surface (a shade lighter than the sheet)
  line: '#CFC4AB', // ruled lines, card edges
  lineStrong: '#9C917B', // emphasised rules, card bottom edge
  ink: '#231F1A', // text + strong rules (14:1 on paper)
  inkSoft: '#625A4E', // secondary text (5.8:1 on paper)
  red: '#9B3A2B', // brick printing ink (5.9:1 on paper; onAccent text 6.4:1)
  blue: '#2E4B70', // indigo ink (7.6:1; onAccent 8.3:1)
  yellow: '#C9972E', // ochre; only behind onYellow text (6.2:1) or as a glyph
  green: '#3F6B3A', // printing green, diagrams only (light signals, threshold lights)
  onAccent: '#FBF6EA', // text on red / blue fills
  onYellow: '#231F1A', // text on ochre, both modes
  white: '#FFFFFF',
  backdrop: 'rgba(35,31,26,0.55)',
  grain: 0.55, // opacity of the paper-grain tile
};

const dark: typeof light = {
  paper: '#1B1814', // night paper: warm near-black
  paperDeep: '#27231D',
  card: '#221E18',
  line: '#3B352C',
  lineStrong: '#5A5244',
  ink: '#EFE6D4', // cream ink (14:1)
  inkSoft: '#B3A892', // 7.5:1
  red: '#E0836C', // 6.4:1 on night paper; night-paper text on it 6.4:1
  blue: '#8FB0DE', // 7.9:1
  yellow: '#DDB35A', // 9:1
  green: '#8DBB85',
  onAccent: '#1B1814',
  onYellow: '#1B1814',
  white: '#FFFFFF',
  backdrop: 'rgba(0,0,0,0.7)',
  grain: 0.35,
};

// Mutable: `applyTheme` swaps the values in place, then the app re-renders.
export const colors = { ...light };
let themeVersion = 0;
let currentMode: ThemeMode = 'light';

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

// Rule weights. Printed rules are light: hairline dividers, 2 px section
// rules, 3 px for the few heavy heads.
export const rule = { hair: 1, mid: 1, thick: 2, heavy: 3 };

// Corner radius of printed cards (a cut card, not a pill).
export const radius = 6;

// Minimum touch target (Apple HIG / Material).
export const TOUCH = 44;

// Printed-card surface: a shade lighter than the sheet, a hairline edge and a
// slightly darker bottom edge so it reads as a card laid on the page. Spread
// into a StyleSheet entry: `{ ...cardSurface(), padding: space.lg }`.
export function cardSurface() {
  return {
    backgroundColor: colors.card,
    borderWidth: rule.hair,
    borderColor: colors.line,
    borderBottomWidth: rule.thick,
    borderBottomColor: colors.lineStrong,
    borderRadius: radius,
  } as const;
}

// Line glyphs (Ionicons outline set, iOS-style strokes) used for every icon.
// No circles, squares or triangles as ornaments: structure comes from the
// ruled lines and card surfaces, meaning from these glyphs and the type.
export const glyph = {
  arrow: 'arrow-forward',
  back: 'arrow-back',
  close: 'close',
  check: 'checkmark',
  star: 'star',
  starOpen: 'star-outline',
  lock: 'lock-closed',
  unlock: 'lock-open-outline',
  refresh: 'refresh',
  warning: 'alert-outline',
  airplane: 'airplane-outline',
  radio: 'radio-outline',
  exam: 'stopwatch-outline',
  practice: 'create-outline',
  cards: 'albums-outline',
  answers: 'list-outline',
  home: 'home-outline',
  about: 'information-outline',
  book: 'book-outline',
  document: 'document-text-outline',
  shield: 'shield-checkmark-outline',
  globe: 'globe-outline',
  moon: 'moon-outline',
  sun: 'sunny-outline',
  trash: 'trash-outline',
  infinite: 'infinite-outline',
  calendar: 'calendar-outline',
  ribbon: 'ribbon-outline',
  swap: 'swap-horizontal-outline',
  help: 'help',
  mail: 'mail-outline',
  spot: 'scan-outline',
  progress: 'stats-chart-outline',
  diagram: 'image-outline',
  flame: 'flame-outline',
  timer: 'timer-outline',
  eye: 'eye-outline',
  flip: 'sync-outline',
} as const;
export type GlyphName = (typeof glyph)[keyof typeof glyph];

export const type = themed(() => ({
  display: { fontFamily: fonts.black, fontSize: 56, lineHeight: 66, color: colors.ink, letterSpacing: -1.5 },
  h1: { fontFamily: fonts.black, fontSize: 34, lineHeight: 41, color: colors.ink, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 27, color: colors.ink, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, color: colors.ink },
  mute: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    color: colors.inkSoft,
    textTransform: 'uppercase' as const,
  },
  tiny: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 15, letterSpacing: 1.5, color: colors.inkSoft },
}));

// Back-compat name used by older imports.
export const font = type;
