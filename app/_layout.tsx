import { AuthListener } from '@/components/auth/AuthListener';
import { NotificationTapHandler } from '@/components/notifications/NotificationTapHandler';
import { AppAlert } from '@/components/ui/AppAlert';
import { Providers } from '@/components/providers/Providers';
import { usePalette } from '@/constants/usePalette';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const p = usePalette();

  return (
    <Providers>
      <StatusBar style="light" backgroundColor={p.bg} translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <AuthListener />
      <NotificationTapHandler />
      <AppAlert />
    </Providers>
  );
}
