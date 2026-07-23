// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { Providers } from '@/components/providers/Providers';
import { AuthListener } from '@/components/auth/AuthListener';

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <AuthListener />
    </Providers>
  );
}
