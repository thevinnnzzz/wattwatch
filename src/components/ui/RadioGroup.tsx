// Radio Group component
import React from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  direction?: 'row' | 'column';
  style?: ViewStyle;
  optionStyle?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
}

export const RadioGroup = ({
  options,
  value,
  onValueChange,
  direction = 'column',
  style,
  optionStyle,
  labelStyle,
  testID,
}: RadioGroupProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        direction === 'row' && styles.row,
        style,
      ]}
      testID={testID}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.option,
            optionStyle,
            option.value === value && styles.optionSelected,
            option.disabled && styles.optionDisabled,
          ]}
          onPress={() => !option.disabled && onValueChange(option.value)}
          disabled={option.disabled}
          accessibilityRole="radio"
          accessibilityState={{ checked: option.value === value, disabled: option.disabled }}
        >
          <View
            style={[
              styles.circle,
              option.value === value && styles.circleSelected,
              option.disabled && styles.circleDisabled,
            ]}
          >
            {option.value === value && (
              <View style={styles.dot} />
            )}
          </View>
          <Text
            style={[
              styles.label,
              { color: theme.colors.meralco.text },
              option.disabled && styles.labelDisabled,
              labelStyle,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  circleDisabled: {
    borderColor: '#94A3B8',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  labelDisabled: {
    color: '#94A3B8',
  },
});

export default RadioGroup;