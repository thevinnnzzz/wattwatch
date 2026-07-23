// Divider component
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { legacyColors } from '@/constants/theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Divider = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 1,
  color,
  style,
  testID,
}: DividerProps) => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? legacyColors.dark : legacyColors.light;

  const dividerColor = color || colors.divider;

  const baseStyle = orientation === 'horizontal' ? styles.horizontal : styles.vertical;

  return (
    <View
      style={[
        baseStyle,
        { borderColor: dividerColor, borderStyle: variant },
        { ...(orientation === 'horizontal' ? { borderBottomWidth: thickness } : { borderRightWidth: thickness }) },
        style,
      ]}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});

export default Divider;