// Design tokens from the Stitch project "Remix of DishDaddy" (indigo on lavender, Plus Jakarta Sans).
// Values come straight from that design's Tailwind config, so a screen built here matches its screenshot.

export const COLORS = {
  // surfaces
  background: '#FBF8FF',
  card: '#FFFFFF', // surface-container-lowest
  surfaceLow: '#F5F2FB', // surface-container-low
  chipBg: '#EFECF5', // surface-container
  surfaceHigh: '#EAE7EF', // surface-container-high
  border: '#E8E7EF', // outline-variant at about 30%
  outline: '#767685',
  // text
  text: '#1B1B21', // on-surface
  muted: '#464653', // on-surface-variant
  // brand
  primary: '#474DC5',
  primaryContainer: '#6067DF',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#E0E0FF', // primary-fixed
  primarySoft: '#E0E0FF', // primary-fixed
  // states. "In stock" is primary in the design; missing uses the tertiary terracotta.
  ok: '#474DC5',
  okSoft: '#E0E0FF',
  okBorder: '#BFC2FF',
  warnText: '#9B3E2B',
  warnSoft: '#FFDAD3',
  warnBorder: '#FFB4A4',
  danger: '#BA1A1A',
  dangerSoft: '#FFDAD6',
  gold: '#775A00', // secondary
  inverse: '#303036',
  inverseText: '#F2EFF8',
} as const;

/** Corner radii: the design uses 1rem for default, 2rem for cards, 3rem for hero and pantry tiles. */
export const RADIUS = { md: 16, lg: 32, xl: 48, full: 999 } as const;

/** Layout spacing from the design: margin 1.25rem, space-lg 1.5rem, space-md 1rem. */
export const SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, margin: 20 } as const;

// One entry per font file: custom fonts have no weight axis in React Native.
export const FONT = {
  medium: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
} as const;
