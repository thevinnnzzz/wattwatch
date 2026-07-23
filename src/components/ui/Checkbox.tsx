// Checkbox component
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Animated, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { legacyColors } from '@/constants/theme';

export interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
}

const sizeMap = {
  sm: { boxSize: 18, iconSize: 12 },
  md: { boxSize: 22, iconSize: 14 },
  lg: { boxSize: 26, iconSize: 16 },
};

export const Checkbox = React.forwardRef<Pressable, CheckboxProps>(
  ({ value, onValueChange, disabled = false, size = 'md', style, testID }, ref) => {
    const scheme = useColorScheme();
    const legacyTheme = scheme === 'dark' ? legacyColors.dark : legacyColors.light;
    const dimensions = sizeMap[size];
    const scale = new Animated.Value(value ? 1 : 0);

    React.useEffect(() => {
      Animated.spring(scale, {
        toValue: value ? 1 : 0,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }, [value]);

    const handlePress = () => {
      if (!disabled) {
        onValueChange(!value);
      }
    };

    return (
      <Pressable
        ref={ref}
        style={[
          styles.container,
          { width: dimensions.boxSize, height: dimensions.boxSize },
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        disabled={disabled}
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
      >
        <Animated.View
          style={[
            styles.box,
            {
              backgroundColor: value ? legacyTheme.meralco.primary : 'transparent',
              borderColor: value ? legacyTheme.meralco.primary : legacyTheme.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.checkmark,
              {
                transform: [{ scale }],
                opacity: value ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.checkmarkText, { fontSize: dimensions.iconSize }]}>✓</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }
);

Checkbox.displayName = 'Checkbox';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 1,
    includeFontPadding: false,
  },
});

export default Checkbox;