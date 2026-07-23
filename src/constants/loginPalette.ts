/**
 * WattWatch Login Palette
 * The canonical design palette extracted from the Login screen.
 * Use this for consistent styling across all screens.
 */

// ─── Core Colours ────────────────────────────────────────────────────────────
export const LP = {
  /** Page / safe-area background */
  bg: '#FFFFFF',

  /** Primary text */
  text: '#111827',

  /** Muted / secondary text */
  textMuted: '#6B7280',

  /** Placeholder text inside inputs */
  placeholder: '#E5E7EB',

  /** Error / destructive */
  error: '#FF5A5F',

  /** Navy — logo ring, nav accent, borders */
  navy: '#1E3A8A',

  /** Gold — gradient end, link accent */
  gold: '#FF8C00',
  goldDark: '#D97706',

  /** Gradient: grey-to-gold — used for pills (inputs & buttons) */
  gradientStart: '#1E3A8A',
  gradientEnd: '#FF8C00',

  /** Input text (inside a gradient pill) */
  inputText: '#FFFFFF',

  /** Card / surface background */
  card: '#F9FAFB',
  cardBorder: '#E5E7EB',

  /** Divider lines */
  divider: '#E5E7EB',

  /** Ambient lightning-bolt amber */
  amber: '#FBC531',
} as const;

/** Array form of the horizontal gradient for LinearGradient */
export const GRADIENT: [string, string] = [LP.gradientStart, LP.gradientEnd];
