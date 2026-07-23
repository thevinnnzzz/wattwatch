// Button component with multiple variants and sizes
// Palette aligns with the Login screen design.
import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator, ForwardedRef } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { LP } from '@/constants/loginPalette';

export interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  style?: any;
  testID?: string;
}

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export const Button = React.forwardRef<Pressable, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      onPress,
      style,
      testID,
    },
    ref: ForwardedRef<Pressable>
  ) => {
    const theme = useTheme();
    const isDisabled = disabled || loading;

    const baseStyles = [
      styles.base,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ];

    const textStyles = [
      styles.textBase,
      styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
      styles[`text${size}` as keyof typeof styles],
      isDisabled && styles.textDisabled,
    ];

    return (
      <Pressable
        ref={ref}
        style={baseStyles}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'destructive' ? theme.colors.textOnPrimary : theme.colors.primary}
            style={styles.spinner}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={textStyles}>{title}</Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants — primary is the grey-to-gold start colour
  primary: {
    backgroundColor: LP.gradientStart,
    borderColor: LP.gradientStart,
  },
  secondary: {
    backgroundColor: LP.navy,
    borderColor: LP.navy,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: LP.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: LP.error,
    borderColor: LP.error,
  },

  // Sizes
  sm: { paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  md: { paddingVertical: 12, paddingHorizontal: 20, gap: 8 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, gap: 10 },

  textBase: { fontWeight: '600', textAlign: 'center' },
  textPrimary: { color: '#FFFFFF' },
  textSecondary: { color: '#FFFFFF' },
  textOutline: { color: LP.gold },
  textGhost: { color: LP.gold },
  textDestructive: { color: '#FFFFFF' },
  textSm: { fontSize: 13 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 17 },
  textDisabled: { opacity: 0.7 },

  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
  spinner: { marginHorizontal: 4 },
});

export default Button;