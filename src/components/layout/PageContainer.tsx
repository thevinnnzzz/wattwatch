// Page Container component with safe area, scroll, and max width
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  testID?: string;
}

export const PageContainer = ({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  testID,
}: PageContainerProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const contentInset = {
    top: insets.top,
    bottom: insets.bottom + (Platform.OS === 'ios' ? 20 : 0),
    left: insets.left,
    right: insets.right,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]} testID={testID}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: contentInset.bottom + 24 },
          contentContainerStyle,
        ]}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentInset={contentInset}
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
});

export default PageContainer;