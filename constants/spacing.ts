export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  '2x': 32,
  '3x': 48,
  '4x': 64,
} as const

// Page margins: 24px horizontal
// Card internal padding: 20–24px
// Section gap (between major blocks): 32–48px
// List item gap (no dividers): 12–16px

export const radius = {
  sm:   8,    // small elements
  md:   16,   // cards, inputs
  lg:   24,   // large feature cards
  xl:   32,   // extra large cards
  full: 9999, // pills, chips, avatar circles — ALL buttons and tags
} as const
