// Colours: "Tomato and cream". Fonts and layout follow the Stitch design system (DishDaddy).

export const COLORS = {
  background: '#FFF8F0',
  card: '#FFFFFF',
  border: '#EADFD3',
  text: '#2B2118',
  muted: '#7A6A5B',
  primary: '#C8442B',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#FBD9CC',
  primarySoft: '#FDE8DF',
  sage: '#F2A65A',
  /** High-protein callouts */
  tertiary: '#9A6700',
  proteinSoft: '#FFF4D6',
  proteinBorder: '#F0D58A',
  /** Ready, matched and confirmed: herb green, so a positive state never looks like an error */
  ok: '#4C7A2E',
  okSoft: '#EEF6E3',
  okBorder: '#C5DDA3',
  warnText: '#A33A22',
  warnSoft: '#FDE8DF',
  warnBorder: '#F5C2B0',
  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  chipBg: '#F5EBDD',
  ring: '#F6D5C8',
} as const;

// One entry per font file: custom fonts have no weight axis in React Native.
export const FONT = {
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  headSemi: 'Epilogue_600SemiBold',
  headBold: 'Epilogue_700Bold',
} as const;
