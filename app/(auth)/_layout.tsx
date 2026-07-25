import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthLayout() {
  const processedRef = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (processedRef.current || !url) return;

      const query = url.split('?')[1] || '';
      const hash = url.split('#')[1] || '';
      const params = new URLSearchParams(query || hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        processedRef.current = true;
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          router.replace('/(auth)/update-password');
        }
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
