/**
 * Theme hook for accessing theme colors and values
 * Uses NativeWind/Tailwind CSS classes via className prop
 * Also provides direct access to theme values for StyleSheet
 */

import { useColorScheme } from 'react-native';
import { Colors, legacyColors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const legacyTheme = scheme === 'dark' ? legacyColors.dark : legacyColors.light;

  // Return theme with colors object for backward compatibility
  return {
    ...theme,
    ...legacyTheme,
    colors: {
      ...theme,
      ...legacyTheme,
      wattwatch: {
        primary: scheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
        primaryDark: scheme === 'dark' ? Colors.dark.primaryDark : Colors.light.primaryDark,
        primaryLight: scheme === 'dark' ? Colors.dark.primaryLight : Colors.light.primaryLight,
        secondary: scheme === 'dark' ? Colors.dark.secondary : Colors.light.secondary,
        secondaryDark: scheme === 'dark' ? Colors.dark.secondaryDark : Colors.light.secondaryDark,
        secondaryLight: scheme === 'dark' ? Colors.dark.secondaryLight : Colors.light.secondaryLight,
        success: scheme === 'dark' ? Colors.dark.success : Colors.light.success,
        successLight: scheme === 'dark' ? Colors.dark.successLight : Colors.light.successLight,
        warning: scheme === 'dark' ? Colors.dark.warning : Colors.light.warning,
        warningLight: scheme === 'dark' ? Colors.dark.warningLight : Colors.light.warningLight,
        error: scheme === 'dark' ? Colors.dark.error : Colors.light.error,
        errorLight: scheme === 'dark' ? Colors.dark.errorLight : Colors.light.errorLight,
        background: scheme === 'dark' ? Colors.dark.background : Colors.light.background,
        surface: scheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
        surfaceVariant: scheme === 'dark' ? Colors.dark.surfaceVariant : Colors.light.surfaceVariant,
        text: scheme === 'dark' ? Colors.dark.text : Colors.light.text,
        textSecondary: scheme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary,
        textTertiary: scheme === 'dark' ? Colors.dark.textTertiary : Colors.light.textTertiary,
        border: scheme === 'dark' ? Colors.dark.border : Colors.light.border,
        borderDark: scheme === 'dark' ? Colors.dark.borderDark : Colors.light.borderDark,
        statusPending: scheme === 'dark' ? Colors.dark.statusPending : Colors.light.statusPending,
        statusPaid: scheme === 'dark' ? Colors.dark.statusPaid : Colors.light.statusPaid,
        statusOverdue: scheme === 'dark' ? Colors.dark.statusOverdue : Colors.light.statusOverdue,
        statusActive: scheme === 'dark' ? Colors.dark.statusActive : Colors.light.statusActive,
        statusSuspended: scheme === 'dark' ? Colors.dark.statusSuspended : Colors.light.statusSuspended,
        statusClosed: scheme === 'dark' ? Colors.dark.statusClosed : Colors.light.statusClosed,
      }
    }
  };
}

// For NativeWind, we use className with tailwind classes
// This hook is mainly for backward compatibility with existing StyleSheet usage
export function useColorSchemeValue<T>(lightValue: T, darkValue: T): T {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkValue : lightValue;
}