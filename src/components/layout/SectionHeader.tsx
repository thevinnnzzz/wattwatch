// Section Header component for grouping content
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, ReactNode } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
    testID?: string;
  };
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  action,
  style,
  titleStyle,
  subtitleStyle,
  testID,
}: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.meralco.text }, titleStyle]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.meralco.textSecondary },
                subtitleStyle,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {action && (
          <Pressable
            style={styles.actionButton}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={action.testID || `${testID}-action`}
          >
            <Text style={[styles.actionText, { color: theme.colors.meralco.primary }]}>
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default SectionHeader;