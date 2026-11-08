// Design tokens: the website's black premium look (near-black, indigo glow, frosted cards), in Plus Jakarta Sans.
// Token names are unchanged from the earlier light design, so every screen picks the new look up from here.

export const COLORS = {
  // surfaces: near-black with frosted, translucent cards
  background: '#050507',
  card: 'rgba(255,255,255,0.07)',
  surfaceLow: 'rgba(255,255,255,0.05)',
  chipBg: 'rgba(255,255,255,0.10)',
  surfaceHigh: 'rgba(255,255,255,0.15)',
  /** Opaque, for things that float over scrolling content (tab bar, toast). */
  floating: '#101018',
  border: 'rgba(255,255,255,0.12)',
  outline: '#6E6E84',
  // text
  text: '#F5F5FA',
  muted: '#A3A3B8',
  // brand
  primary: '#474DC5',
  primaryContainer: '#6067DF',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#E0E0FF',
  primarySoft: 'rgba(96,103,223,0.30)',
  /** Brand colour for text and icons on black, where #474DC5 itself is too dark to read. */
  primaryText: '#BFC2FF',
  // states. "In stock" is indigo; missing uses the ember orange.
  ok: '#BFC2FF',
  okSoft: 'rgba(96,103,223,0.30)',
  okBorder: 'rgba(191,194,255,0.40)',
  warnText: '#FF9B85',
  warnSoft: 'rgba(255,122,89,0.16)',
  warnBorder: 'rgba(255,122,89,0.45)',
  danger: '#FF8A80',
  dangerSoft: 'rgba(255,90,90,0.16)',
  gold: '#FCCF5A',
  inverse: '#1E1E2A',
  inverseText: '#F5F5FA',
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
