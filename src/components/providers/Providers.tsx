// Global providers for the app
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { paperTheme, paperDarkTheme } from '@/constants/paperTheme';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/appStore';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = useAppStore((state) => state.theme);

  const resolvedTheme = theme === 'system' ? (colorScheme ?? 'light') : theme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={resolvedTheme === 'dark' ? paperDarkTheme : paperTheme}>
            {children}
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}