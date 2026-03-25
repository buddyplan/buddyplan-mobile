// Stitch Design System — "The Warm Kitchen"
export const darkColors = {
  // ── Backgrounds & Surfaces ──────────────────────────────────────────────
  background:              '#1a1916',
  surface:                 '#1a1916',
  surfaceContainerLowest:  '#211f1b',
  surfaceContainerLow:     '#272420',
  surfaceContainer:        '#2e2b26',
  surfaceContainerHigh:    '#35322c',
  surfaceContainerHighest: '#3c3933',
  surfaceDim:              '#131210',
  surfaceBright:           '#403d38',

  // ── Primary — Light Peach (inverted) ────────────────────────────────────
  primary:                 '#eec8a2',
  primaryDim:              '#ddb88e',
  primaryContainer:        '#4f371b',
  primaryFixed:            '#4f371b',
  primaryFixedDim:         '#3f2d16',
  onPrimary:               '#3a2509',
  onPrimaryContainer:      '#fdd6af',
  inversePrimary:          '#765a3b',

  // ── Secondary ────────────────────────────────────────────────────────────
  secondary:               '#cfb79a',
  secondaryDim:            '#bfa387',
  secondaryContainer:      '#3d2e1a',
  secondaryFixed:          '#3d2e1a',
  secondaryFixedDim:       '#302515',
  onSecondary:             '#3a2509',
  onSecondaryContainer:    '#fdddbd',

  // ── Tertiary — Light Sage ────────────────────────────────────────────────
  tertiary:                '#ceeecc',
  tertiaryDim:             '#bde0bb',
  tertiaryContainer:       '#1e3d20',
  tertiaryFixed:           '#1e3d20',
  tertiaryFixedDim:        '#163018',
  onTertiary:              '#0a200c',
  onTertiaryContainer:     '#dcfcd9',

  // ── Text ─────────────────────────────────────────────────────────────────
  onBackground:            '#e8e6e0',
  onSurface:               '#e8e6e0',
  onSurfaceVariant:        '#a8a8a0',
  outline:                 '#787870',
  outlineVariant:          '#48483f',

  // ── Error ────────────────────────────────────────────────────────────────
  error:                   '#ff8a70',
  errorDim:                '#ff6b52',
  errorContainer:          '#5c2419',
  onError:                 '#fff7f6',
  onErrorContainer:        '#ff8a70',

  // ── Misc ─────────────────────────────────────────────────────────────────
  inverseSurface:          '#e8e6e0',
  inverseOnSurface:        '#31332f',
  surfaceTint:             '#eec8a2',

  // ── Backward-compat aliases ───────────────────────────────────────────────
  bg:         '#1a1916',
  surfaceLow: '#35322c',
  muted:      '#a8a8a0',
  accent:     '#eec8a2',
  accentLight: '#4f371b',
  border:     '#48483f',
  pillBg:     '#2e2b26',
  danger:     '#ff8a70',
} as const

export const colors = {
  // ── Backgrounds & Surfaces ──────────────────────────────────────────────
  background:              '#fbf9f5', // page background
  surface:                 '#fbf9f5', // same as background (semantic alias kept for legacy)
  surfaceContainerLowest:  '#ffffff', // lifted cards (most prominent)
  surfaceContainerLow:     '#f5f4ef', // subtle section separation
  surfaceContainer:        '#efeee9', // input fields, unselected chips
  surfaceContainerHigh:    '#e9e8e3', // active/pressed states
  surfaceContainerHighest: '#e3e3dd', // strongest separation
  surfaceDim:              '#dadad4', // disabled states
  surfaceBright:           '#fbf9f5',

  // ── Primary — Warm Brown ─────────────────────────────────────────────────
  primary:                 '#765a3b', // buttons, icons, brand text
  primaryDim:              '#694e30', // button gradient end
  primaryContainer:        '#fdd6af', // light peach — selected states
  primaryFixed:            '#fdd6af',
  primaryFixedDim:         '#eec8a2',
  onPrimary:               '#fff7f3', // text on primary buttons
  onPrimaryContainer:      '#64492c', // text on primary container
  inversePrimary:          '#fdd6af',

  // ── Secondary — Warm Taupe ───────────────────────────────────────────────
  secondary:               '#725b42',
  secondaryDim:            '#654f37',
  secondaryContainer:      '#fdddbd',
  secondaryFixed:          '#fdddbd',
  secondaryFixedDim:       '#efcfb0',
  onSecondary:             '#fff7f3',
  onSecondaryContainer:    '#644e36',

  // ── Tertiary — Sage Green ────────────────────────────────────────────────
  tertiary:                '#4a664b', // success, tips, "Buddy" moments
  tertiaryDim:             '#3e5a40',
  tertiaryContainer:       '#dcfcd9', // light sage green — tip cards
  tertiaryFixed:           '#dcfcd9',
  tertiaryFixedDim:        '#ceeecc',
  onTertiary:              '#e9ffe5',
  onTertiaryContainer:     '#476248',

  // ── Text ─────────────────────────────────────────────────────────────────
  onBackground:            '#31332f', // primary text
  onSurface:               '#31332f', // same (backward compat + semantic)
  onSurfaceVariant:        '#5e605b', // secondary/muted text
  outline:                 '#7a7b76',
  outlineVariant:          '#b2b2ad', // subtle ghost borders

  // ── Error / Warning ──────────────────────────────────────────────────────
  error:                   '#a73b21',
  errorDim:                '#791903',
  errorContainer:          '#fd795a',
  onError:                 '#fff7f6',
  onErrorContainer:        '#6e1400',

  // ── Misc ─────────────────────────────────────────────────────────────────
  inverseSurface:          '#0e0e0d',
  inverseOnSurface:        '#9e9d9a',
  surfaceTint:             '#765a3b',

  // ── Backward-compat aliases (old token names → new values) ───────────────
  // These allow existing files to keep working without changes
  bg:         '#fbf9f5',   // = background
  surfaceLow: '#e9e8e3',   // = surfaceContainerHigh
  muted:      '#5e605b',   // = onSurfaceVariant
  accent:     '#765a3b',   // was orange #e07b39 → now maps to primary (warm brown)
  accentLight: '#fdd6af',  // was light orange → now maps to primaryContainer (peach)
  border:     '#b2b2ad',   // = outlineVariant
  pillBg:     '#efeee9',   // = surfaceContainer
  danger:     '#a73b21',   // = error
} as const

// ── Semantic Shortcuts ─────────────────────────────────────────────────────
export const C = {
  bg:          colors.background,
  card:        colors.surfaceContainerLowest, // white cards
  cardAlt:     colors.surfaceContainerLow,    // subtle cards
  section:     colors.surfaceContainer,       // chip backgrounds
  pressed:     colors.surfaceContainerHigh,   // tap state
  brand:       colors.primary,                // #765a3b warm brown
  brandLight:  colors.primaryContainer,       // #fdd6af peach
  success:     colors.tertiaryContainer,      // #dcfcd9 sage green
  successText: colors.tertiary,               // #4a664b
  text:        colors.onBackground,           // #31332f
  textMuted:   colors.onSurfaceVariant,       // #5e605b
  textLight:   colors.outline,                // #7a7b76
} as const
