import { View, type ViewProps } from 'react-native';

import { legacyColors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof typeof legacyColors.light;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? legacyColors.dark : legacyColors.light;

  return <View style={[{ backgroundColor: colors[type ?? 'background'] }, style]} {...otherProps} />;
}
