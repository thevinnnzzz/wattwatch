import { AuthListener } from '@/components/auth/AuthListener';
import { NotificationTapHandler } from '@/components/notifications/NotificationTapHandler';
import { AppAlert } from '@/components/ui/AppAlert';
import Spinner from '@/components/ui/Loading';
import { Providers } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/authStore';
import { usePalette } from '@/constants/usePalette';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  const p = usePalette();
  const initialized = useAuthStore((s) => s.initialized);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Providers>
      <StatusBar style="light" backgroundColor={p.bg} translucent={false} />
      {!initialized ? (
        <Spinner />
      ) : (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <AuthListener />
          <NotificationTapHandler />
          <AppAlert />
        </>
      )}
    </Providers>
  );
}
