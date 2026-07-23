// Screen Header component with back button and actions
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

export const ScreenHeader = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  leftAction,
  rightAction,
  style,
  titleStyle,
  subtitleStyle,
  testID,
}: ScreenHeaderProps) => {
  const theme = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.meralco.surface },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.inner}>
        {showBack && (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID={`${testID}-back`}
          >
            <Text style={{ ...styles.backIcon, color: theme.colors.meralco.text }}>←</Text>
          </Pressable>
        )}
        {!showBack && leftAction && <View style={styles.leftAction}>{leftAction}</View>}

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

        <View style={[styles.rightContainer, { width: showBack ? 44 : 0 }]}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  leftAction: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default ScreenHeader;