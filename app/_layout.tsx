import { AuthListener } from '@/components/auth/AuthListener';
import { NotificationTapHandler } from '@/components/notifications/NotificationTapHandler';
import { AppAlert } from '@/components/ui/AppAlert';
import { Providers } from '@/components/providers/Providers';
import { useAuthStore } from '@/store/authStore';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Providers>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {!initialized ? (
        <View style={splashStyles.container}>
          <View style={splashStyles.logoBadge}>
            <Image source={require('@/assets/images/icon.png')} style={splashStyles.logoImage} resizeMode="contain" />
          </View>
          <View style={splashStyles.brandRow}>
            <Text style={splashStyles.brandWatt}>watt</Text>
            <Text style={splashStyles.brandWatch}>watch</Text>
          </View>
        </View>
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

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandWatt: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  brandWatch: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FF8C00',
  },
});
