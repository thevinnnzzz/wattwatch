// Switch component
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  thumbStyle?: ViewStyle;
  trackStyle?: ViewStyle;
  testID?: string;
}

const sizeMap = {
  sm: { trackWidth: 36, trackHeight: 20, thumbSize: 16 },
  md: { trackWidth: 44, trackHeight: 24, thumbSize: 20 },
  lg: { trackWidth: 52, trackHeight: 28, thumbSize: 24 },
};

export const Switch = React.forwardRef<Pressable, SwitchProps>(
  ({ value, onValueChange, disabled = false, size = 'md', style, thumbStyle, trackStyle, testID }, ref) => {
    const theme = useTheme();
    const dimensions = sizeMap[size];
    const translateX = new Animated.Value(value ? dimensions.trackWidth - dimensions.thumbSize - 2 : 2);

    React.useEffect(() => {
      Animated.timing(translateX, {
        toValue: value ? dimensions.trackWidth - dimensions.thumbSize - 2 : 2,
        duration: 200,
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
          { width: dimensions.trackWidth, height: dimensions.trackHeight },
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        disabled={disabled}
        testID={testID}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      >
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: value ? theme.colors.meralco.primary : theme.colors.meralco.border,
            },
            trackStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            {
              width: dimensions.thumbSize,
              height: dimensions.thumbSize,
              transform: [{ translateX }],
            },
            thumbStyle,
          ]}
        />
      </Pressable>
    );
  }
);

Switch.displayName = 'Switch';

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
  },
  thumb: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Switch;