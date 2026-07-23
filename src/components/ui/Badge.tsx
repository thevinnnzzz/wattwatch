// Badge component for status indicators
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'paid' | 'overdue' | 'active' | 'suspended' | 'closed';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const variantColors: Record<string, { bg: string; text: string; dot: string }> = {
  default: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  success: { bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A' },
  warning: { bg: '#FEF9C3', text: '#FBBF24', dot: '#FBBF24' },
  error: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
  info: { bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' },
  pending: { bg: '#FEF9C3', text: '#FBBF24', dot: '#FBBF24' },
  paid: { bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A' },
  overdue: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
  active: { bg: '#E0F2FE', text: '#0284C7', dot: '#0284C7' },
  suspended: { bg: '#FFEDD5', text: '#F97316', dot: '#F97316' },
  closed: { bg: '#F1F5F9', text: '#94A3B8', dot: '#94A3B8' },
};

const sizeStyles = {
  sm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, dotSize: 5 },
  md: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, dotSize: 6 },
  lg: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, dotSize: 7 },
};

export const Badge = ({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
  textStyle,
  testID,
}: BadgeProps) => {
  const theme = useTheme();
  const colors = variantColors[variant] || variantColors.default;
  const sizing = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, paddingHorizontal: sizing.paddingHorizontal, paddingVertical: sizing.paddingVertical, borderRadius: sizing.borderRadius },
        style,
      ]}
      testID={testID}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.dot, width: sizing.dotSize, height: sizing.dotSize },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizing.fontSize },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default Badge;
