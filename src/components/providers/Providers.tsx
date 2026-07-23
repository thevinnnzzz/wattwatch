// Global providers for the app
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { paperTheme, paperDarkTheme } from '@/constants/paperTheme';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/appStore';
import { queryClient } from '@/lib/query-client';

// expo-notifications push functionality was removed from Expo Go starting SDK 53.
// It only works in development builds (expo-dev-client). We wrap the import
// in a lazy-load pattern so the app does not crash inside Expo Go.
let Notifications: typeof import('expo-notifications') | null = null;
let notificationHandlerSet = false;

try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('expo-notifications not available (likely running in Expo Go). Push notifications will only work in a development build.');
}

if (Notifications && !notificationHandlerSet) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  notificationHandlerSet = true;
}

import { useNotifications } from '@/hooks/useNotifications';

export function Providers({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = useAppStore((state) => state.theme);

  // Register for push notifications — this runs the push token registration
  // and saves the Expo push token to the user's Supabase profile.
  // The hook internally handles the Expo Go vs dev-build distinction.
  useNotifications();

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