import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator, ForwardedRef } from 'react-native';
import { usePalette } from '@/constants/usePalette';

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
    const p = usePalette();
    const isDisabled = disabled || loading;

    const variantColors = {
      primary: { bg: p.gradientStart, border: p.gradientStart, text: '#FFFFFF' },
      secondary: { bg: p.navy, border: p.navy, text: '#FFFFFF' },
      outline: { bg: 'transparent', border: p.gold, text: p.gold },
      ghost: { bg: 'transparent', border: 'transparent', text: p.gold },
      destructive: { bg: p.error, border: p.error, text: '#FFFFFF' },
    };

    const vc = variantColors[variant];

    return (
      <Pressable
        ref={ref}
        style={[
          styles.base,
          styles[size],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          { backgroundColor: vc.bg, borderColor: vc.border },
          style,
        ]}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : p.gold}
            style={styles.spinner}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={[styles.textBase, styles[`text${size}`], { color: vc.text }]}>{title}</Text>
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
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  sm: { paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  md: { paddingVertical: 12, paddingHorizontal: 20, gap: 8 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, gap: 10 },
  textBase: { fontWeight: '600', textAlign: 'center' },
  textSm: { fontSize: 13 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 17 },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
  spinner: { marginHorizontal: 4 },
});

export default Button;
