export const lightPalette = {
  bg: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  placeholder: '#E5E7EB',
  error: '#FF5A5F',
  navy: '#1E3A8A',
  gold: '#FF8C00',
  goldDark: '#D97706',
  gradientStart: '#1E3A8A',
  gradientEnd: '#FF8C00',
  inputText: '#FFFFFF',
  card: '#F9FAFB',
  cardBorder: '#E5E7EB',
  divider: '#E5E7EB',
  amber: '#FBC531',
} as const;

export const darkPalette = {
  bg: '#0F172A',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  placeholder: '#64748B',
  error: '#F87171',
  navy: '#334155',
  gold: '#D4AF37',
  goldDark: '#D97706',
  gradientStart: '#D4AF37',
  gradientEnd: '#B8860B',
  inputText: '#F1F5F9',
  card: '#1E293B',
  cardBorder: '#334155',
  divider: '#334155',
  amber: '#FBBF24',
} as const;

export type Palette = typeof lightPalette;

export function usePalette(): Palette {
  return lightPalette;
}
