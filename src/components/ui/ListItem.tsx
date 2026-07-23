// ListItem component
import React from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

export const ListItem = ({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  disabled = false,
  style,
  titleStyle,
  subtitleStyle,
  testID,
}: ListItemProps) => {
  const theme = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.meralco.text },
            disabled && styles.titleDisabled,
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.meralco.textSecondary },
              disabled && styles.subtitleDisabled,
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  leading: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleDisabled: {
    color: '#94A3B8',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  subtitleDisabled: {
    color: '#94A3B8',
  },
  trailing: {
    flexShrink: 0,
  },
});

export default ListItem;