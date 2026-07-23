import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { usePalette } from '@/constants/usePalette';

interface Props {
  showBrandName?: boolean;
  size?: number;
}

export default function WattWatchLogo({ showBrandName = false, size = 80 }: Props) {
  const p = usePalette();

  return (
    <View style={[styles.wrap, { gap: size * 0.15 }]}>
      <Image
        source={require('@/assets/images/wattwatch-logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showBrandName && <Text style={[styles.brandTitle, { color: p.text }]}>WATTWATCH</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
