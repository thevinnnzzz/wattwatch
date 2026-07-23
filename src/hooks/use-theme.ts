/**
 * Theme hook for accessing theme colors and values
 * Uses NativeWind/Tailwind CSS classes via className prop
 * Also provides direct access to theme values for StyleSheet
 */

import { Colors, legacyColors } from '@/constants/theme';

export function useTheme() {
  const theme = Colors.light;
  const legacyTheme = legacyColors.light;

  // Return theme with colors object for backward compatibility
  return {
    ...theme,
    ...legacyTheme,
    colors: {
      ...theme,
      ...legacyTheme,
      wattwatch: {
        primary: Colors.light.primary,
        primaryDark: Colors.light.primaryDark,
        primaryLight: Colors.light.primaryLight,
        secondary: Colors.light.secondary,
        secondaryDark: Colors.light.secondaryDark,
        secondaryLight: Colors.light.secondaryLight,
        success: Colors.light.success,
        successLight: Colors.light.successLight,
        warning: Colors.light.warning,
        warningLight: Colors.light.warningLight,
        error: Colors.light.error,
        errorLight: Colors.light.errorLight,
        background: Colors.light.background,
        surface: Colors.light.surface,
        surfaceVariant: Colors.light.surfaceVariant,
        text: Colors.light.text,
        textSecondary: Colors.light.textSecondary,
        textTertiary: Colors.light.textTertiary,
        border: Colors.light.border,
        borderDark: Colors.light.borderDark,
        statusPending: Colors.light.statusPending,
        statusPaid: Colors.light.statusPaid,
        statusOverdue: Colors.light.statusOverdue,
        statusActive: Colors.light.statusActive,
        statusSuspended: Colors.light.statusSuspended,
        statusClosed: Colors.light.statusClosed,
      }
    }
  };
}

export function useColorSchemeValue<T>(lightValue: T, darkValue: T): T {
  return lightValue;
}