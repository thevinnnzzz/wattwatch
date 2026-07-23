import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { usePalette } from '@/constants/usePalette';
import type { Palette } from '@/constants/usePalette';
import Spinner from '@/components/ui/Loading';

export default function VerifyScreen() {
  const p = usePalette();
  const styles = createStyles(p);
  const [status, setStatus] = useState('Verifying your account...');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace('/(auth)/');
          return;
        }

        const fragment = url.split('#')[1] || '';
        const fragmentParams = new URLSearchParams(fragment);
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        router.replace('/(auth)/');
      } catch {
        setStatus('Verification failed. Please try signing in.');
        setTimeout(() => router.replace('/(auth)/'), 3000);
      }
    };

    handleVerification();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Spinner />
      <Text style={styles.text}>{status}</Text>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: p.text,
  },
});
