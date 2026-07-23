// src/app/_layout.tsx
import { AuthListener } from '@/components/auth/AuthListener';
import { Providers } from '@/components/providers/Providers';
import { LP } from '@/constants/loginPalette';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="light" backgroundColor={LP.bg} translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <AuthListener />
    </Providers>
  );
}