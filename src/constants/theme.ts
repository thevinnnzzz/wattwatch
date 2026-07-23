/**
 * WattWatch Theme Configuration
 * Colour palette derived from the Login screen design.
 */
import '@/global.css';
import { Platform } from 'react-native';
import { LP } from './loginPalette';

/**
 * Core colour palette — white backgrounds, black text, gold accents.
 */
export const Colors = {
  light: {
    // Brand
    primary: LP.gold,
    primaryDark: LP.goldDark,
    primaryLight: '#FEF3C7',    // amber-100
    secondary: LP.navy,
    secondaryDark: '#14305A',
    secondaryLight: '#E0ECFF',

    // Semantic
    success: '#00A651',
    successLight: '#E6F7ED',
    warning: '#FFB800',
    warningLight: '#FFF9E6',
    error: LP.error,
    errorLight: '#FEF2F2',

    // Surfaces
    background: LP.bg,
    surface: LP.bg,
    surfaceVariant: LP.card,
    surfaceElevated: LP.bg,

    // Text — black primary, grey secondary
    text: LP.text,
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    // Borders
    border: LP.divider,
    borderDark: '#D1D5DB',
    borderFocus: LP.gold,

    // Statuses
    statusPending: '#FFB800',
    statusPaid: '#00A651',
    statusOverdue: LP.error,
    statusActive: '#00A651',
    statusSuspended: '#FF6B00',
    statusClosed: '#9CA3AF',

    // Component specific
    cardBackground: LP.bg,
    inputBackground: LP.bg,
    inputBorder: LP.divider,
    inputBorderFocus: LP.gold,
    buttonPrimaryBackground: LP.gradientStart,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBackground: LP.card,
    buttonSecondaryText: LP.text,
    buttonOutlineBorder: LP.gold,
    buttonOutlineText: LP.gold,
    buttonGhostText: LP.gold,
    buttonDestructiveBackground: LP.error,
    buttonDestructiveText: '#FFFFFF',
    disabledBackground: LP.card,
    disabledText: '#9CA3AF',
    divider: LP.divider,
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: LP.gold,
    primaryDark: LP.goldDark,
    primaryLight: '#4D3A00',
    secondary: LP.navy,
    secondaryDark: '#1C3B6F',
    secondaryLight: '#082f49',

    success: '#34D399',
    successLight: '#064E35',
    warning: '#FBBF24',
    warningLight: '#4D3A00',
    error: '#F87171',
    errorLight: '#4D0F0F',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    surfaceElevated: '#1E293B',

    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    border: '#334155',
    borderDark: '#475569',
    borderFocus: LP.gold,

    statusPending: '#FBBF24',
    statusPaid: '#34D399',
    statusOverdue: '#F87171',
    statusActive: '#22C55E',
    statusSuspended: '#FF8533',
    statusClosed: '#64748B',

    cardBackground: '#1E293B',
    inputBackground: '#1E293B',
    inputBorder: '#334155',
    inputBorderFocus: LP.gold,
    buttonPrimaryBackground: LP.gold,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBackground: '#334155',
    buttonSecondaryText: '#F1F5F9',
    buttonOutlineBorder: LP.gold,
    buttonOutlineText: LP.gold,
    buttonGhostText: LP.gold,
    buttonDestructiveBackground: '#DC2626',
    buttonDestructiveText: '#FFFFFF',
    disabledBackground: '#334155',
    disabledText: '#64748B',
    divider: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

// ─── Legacy aliases ──────────────────────────────────────────────────────────
export const legacyColors = {
  light: {
    ...Colors.light,
    backgroundElement: Colors.light.surfaceVariant,
    backgroundSelected: Colors.light.surfaceVariant,
    divider: Colors.light.divider,
    text: Colors.light.text,
    textSecondary: Colors.light.textSecondary,
    textTertiary: Colors.light.textTertiary,
    wattwatch: Colors.light,
  },
  dark: {
    ...Colors.dark,
    backgroundElement: Colors.dark.surfaceVariant,
    backgroundSelected: Colors.dark.surfaceVariant,
    divider: Colors.dark.divider,
    text: Colors.dark.text,
    textSecondary: Colors.dark.textSecondary,
    textTertiary: Colors.dark.textTertiary,
    wattwatch: Colors.dark,
  },
};

export const allColors = {
  light: Colors.light,
  dark: Colors.dark,
  wattwatch: Colors.light,
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Fonts ───────────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace',
    display: 'Spline Sans', body: 'Inter',
  },
  android: {
    sans: 'Roboto', serif: 'Noto Serif', rounded: 'Roboto', mono: 'Roboto Mono',
    display: 'Spline Sans', body: 'Inter',
  },
  web: {
    sans: 'var(--font-sans)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)', display: 'var(--font-display)', body: 'var(--font-body)',
  },
  default: {
    sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace',
    display: 'Spline Sans', body: 'Inter',
  },
});

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  half: 2, one: 4, two: 8, three: 12, four: 16,
  five: 20, six: 24, seven: 28, eight: 32,
  ten: 40, twelve: 48, sixteen: 64, twenty: 80, twentyfour: 96,
} as const;
export type SpacingKey = keyof typeof Spacing;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const BorderRadius = {
  none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999,
} as const;
export type BorderRadiusKey = keyof typeof BorderRadius;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 8 },
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const Typography = {
  display: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const, fontFamily: Fonts?.display || Fonts?.sans },
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, fontFamily: Fonts?.sans },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const, fontFamily: Fonts?.sans },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, fontFamily: Fonts?.sans },
  'body-lg': { fontSize: 18, lineHeight: 28, fontWeight: '400' as const, fontFamily: Fonts?.body || Fonts?.sans },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: Fonts?.body || Fonts?.sans },
  'body-sm': { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: Fonts?.body || Fonts?.sans },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily: Fonts?.body || Fonts?.sans },
  button: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: Fonts?.body || Fonts?.sans },
  overline: { fontSize: 10, lineHeight: 16, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontFamily: Fonts?.body || Fonts?.sans },
} as const;
export type TypographyKey = keyof typeof Typography;

// ─── Misc ────────────────────────────────────────────────────────────────────
export const Breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 } as const;
export const ZIndex = { hide: -1, base: 0, dropdown: 1000, sticky: 1100, modal: 1200, popover: 1300, tooltip: 1400, toast: 1500 } as const;
export const AnimationDuration = { fast: 150, normal: 250, slow: 350 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Theme = {
  colors: Colors, fonts: Fonts, spacing: Spacing, borderRadius: BorderRadius,
  shadows: Shadows, typography: Typography, breakpoints: Breakpoints,
  zIndex: ZIndex, animationDuration: AnimationDuration,
  bottomTabInset: BottomTabInset, maxContentWidth: MaxContentWidth,
} as const;

export default Theme;