import { View, type ViewProps } from 'react-native';

import { legacyColors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof typeof legacyColors.light;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const colors = legacyColors.light;

  return <View style={[{ backgroundColor: colors[type ?? 'background'] }, style]} {...otherProps} />;
}
