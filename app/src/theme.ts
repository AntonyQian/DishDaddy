// Colours and fonts from the Stitch design system "Campus Fuel & Pantry" (DishDaddy).

export const COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
  muted: '#6B7280',
  primary: '#2D6A4F',
  onPrimary: '#FFFFFF',
  primarySoft: '#E8F5E9',
  sage: '#52B788',
  /** High-protein callouts */
  tertiary: '#E76F51',
  proteinSoft: '#FFF7ED',
  proteinBorder: '#FDBA74',
  ok: '#16A34A',
  okSoft: '#F0FDF4',
  warnText: '#B45309',
  warnSoft: '#FFFBEB',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  chipBg: '#F3F4F6',
  ring: '#D8F3DC',
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
