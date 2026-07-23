// Auth state listener component
// Handles navigation routing based on auth state. The actual auth
// initialization is done by the auth store's `initialize()` function.
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import { useSegments } from 'expo-router';

export function AuthListener() {
  const { user, initialized, initialize } = useAuthStore();
  const segments = useSegments();

  // Run store initialization on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Navigate based on auth state
  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    // No user → must be on auth screen
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/');
      return;
    }

    // Has user → must be on app screen
    if (user && inAuthGroup) {
      router.replace('/(app)/');
      return;
    }
  }, [user, initialized, segments]);

  return null;
}