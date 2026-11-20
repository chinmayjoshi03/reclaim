/** Dark theme only. All colours live here. */
export const colors = {
  bg: '#0E0F12',
  surface: '#17191E',
  surfaceRaised: '#1D2026',
  border: '#262A31',
  text: '#E8E8EA',
  muted: '#8A8F98',

  green: '#3DDC97',
  greenSoft: '#163327',
  amber: '#F5B544',
  amberSoft: '#33270F',
  red: '#E5646E',

  gold: '#D4A72C',
  goldSoft: '#2A2418',
  warmFaint: '#1F1C17',
  warmBorder: '#3A342A',

  onAccent: '#0E0F12',
  white: '#FFFFFF',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const MIN_TAP = 48;

export const type = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  serifTitle: { fontFamily: 'serif', fontSize: 30, fontWeight: '700' as const, color: colors.text },
};
