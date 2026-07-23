// Loading components - Spinner, Skeleton, Shimmer
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

const sizeMap = {
  sm: 'small',
  md: 'large',
  lg: 'large',
};

export const Spinner = React.forwardRef<View, SpinnerProps>(
  ({ size = 'md', color, style, testID }, ref) => {
    const theme = useTheme();
    const spinnerColor = color || theme.colors.primary;

    return (
      <View
        ref={ref}
        style={[styles.container, style]}
        testID={testID}
      >
        <ActivityIndicator
          size={sizeMap[size]}
          color={spinnerColor}
        />
      </View>
    );
  }
);

Spinner.displayName = 'Spinner';

// Skeleton loader for content placeholders
export interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

export const Skeleton = ({ width = '100%', height, borderRadius = 8, style, testID }: SkeletonProps) => {
  const theme = useTheme();
  const animation = useSharedValue(0);

  React.useEffect(() => {
    animation.value = withTiming(1, {
      duration: 1500,
      easing: Easing.inOut(Easing.quad),
    }, () => {
      animation.value = 0;
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = animation.value;
    return {
      opacity: opacity * 0.5 + 0.5,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, backgroundColor: theme.colors.meralco.border },
        animatedStyle,
        style,
      ]}
      testID={testID}
    />
  );
};

// Shimmer effect for loading lists
export const Shimmer = ({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) => {
  const theme = useTheme();
  const animation = useSharedValue(0);

  React.useEffect(() => {
    animation.value = withTiming(1, {
      duration: 1200,
      easing: Easing.linear,
    }, () => {
      animation.value = 0;
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { backgroundColor: theme.colors.meralco.border },
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

// Full page loading overlay
export const LoadingOverlay = ({ visible, message, testID }: { visible: boolean; message?: string; testID?: string }) => {
  if (!visible) return null;

  const theme = useTheme();

  return (
    <View style={styles.overlay} testID={testID}>
      <View style={styles.overlayContent}>
        <Spinner size="lg" />
        {message && (
          <Text style={[styles.overlayText, { color: theme.colors.meralco.text }]}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Spinner;