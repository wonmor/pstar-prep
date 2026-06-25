// Central design tokens — aviation / Transport-Canada inspired palette.
export const colors = {
  navy: '#0B2545',
  navySoft: '#13315C',
  blue: '#1B6CA8',
  blueBright: '#2E86DE',
  sky: '#EAF2FB',
  skyLine: '#D4E4F7',
  bg: '#F4F7FB',
  card: '#FFFFFF',
  text: '#0B2545',
  textMute: '#5A6B82',
  textFaint: '#8A99AE',
  green: '#16A34A',
  greenSoft: '#E7F7EE',
  red: '#E5484D',
  redSoft: '#FDECEC',
  amber: '#E8A30C',
  amberSoft: '#FCF3DC',
  border: '#E2E9F2',
  shadow: '#0B2545',
  white: '#FFFFFF',
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

export const font = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  mute: { fontSize: 13, fontWeight: '500' as const, color: colors.textMute },
  tiny: { fontSize: 11, fontWeight: '600' as const, color: colors.textFaint },
};
