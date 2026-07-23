// Avatar component with image, initials fallback, and sizes
import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface AvatarProps {
  source?: { uri: string } | number;
  name?: string; // Used for initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'circle' | 'square';
  style?: ViewStyle;
  testID?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export const Avatar = React.forwardRef<View, AvatarProps>(
  ({ source, name, size = 'md', shape = 'circle', style, testID }, ref) => {
    const theme = useTheme();
    const dimension = typeof size === 'number' ? size : sizeMap[size];
    const fontSize = dimension * 0.35;
    const borderRadius = shape === 'circle' ? dimension / 2 : 8;

    const getInitials = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const getColorFromName = (name: string) => {
      const colors = [
        '#0066CC', '#FF6B00', '#00A651', '#FFB800', '#DC2626',
        '#7C3AED', '#EC4899', '#0891B2', '#65A30D', '#EA580C',
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    if (source) {
      return (
        <View
          ref={ref}
          style={[
            styles.container,
            { width: dimension, height: dimension, borderRadius },
            style,
          ]}
          testID={testID}
        >
          <Image
            source={source}
            style={[
              styles.image,
              { width: dimension, height: dimension, borderRadius },
            ]}
            resizeMode="cover"
          />
        </View>
      );
    }

    const backgroundColor = name ? getColorFromName(name) : theme.colors.meralco.primary;
    const initials = name ? getInitials(name) : '?';

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          { width: dimension, height: dimension, borderRadius, backgroundColor },
          style,
        ]}
        testID={testID}
      >
        <Text style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>
          {initials}
        </Text>
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {},
  initials: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 1,
    includeFontPadding: false,
  },
});

export default Avatar;