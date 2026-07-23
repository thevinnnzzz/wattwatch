// Card components
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  testID?: string;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, style, variant = 'default', padding = 'md', testID }, ref) => {
    const theme = useTheme();

    const variantStyles = {
      default: {
        ...styles.default,
        borderColor: theme.colors.border,
      },
      outlined: {
        ...styles.outlined,
        borderColor: theme.colors.border,
      },
      elevated: styles.elevated,
    };

    const paddingStyles = {
      none: styles.paddingNone,
      sm: styles.paddingSm,
      md: styles.paddingMd,
      lg: styles.paddingLg,
    };

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          { backgroundColor: theme.colors.cardBackground },
          variantStyles[variant],
          paddingStyles[padding],
          style,
        ]}
        testID={testID}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.surfaceVariant }, style]} testID={testID}>
      {children}
    </View>
  );
};

export const CardContent = ({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) => (
  <View style={[styles.content, style]} testID={testID}>
    {children}
  </View>
);

export const CardFooter = ({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: theme.colors.surfaceVariant }, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  default: {
    borderWidth: 1,
  },
  outlined: {
    borderWidth: 2,
  },
  elevated: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  paddingNone: {},
  paddingSm: { padding: 12 },
  paddingMd: { padding: 16 },
  paddingLg: { padding: 24 },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  content: {},
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default Card;
