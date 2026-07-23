import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '@/constants/usePalette';
import type { Palette } from '@/constants/usePalette';
import Spinner from '@/components/ui/Loading';

export default function VerifyScreen() {
  const p = usePalette();
  const styles = createStyles(p);

  useEffect(() => {
    router.replace('/(auth)/');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Spinner />
      <Text style={styles.text}>Verifying your account...</Text>
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
