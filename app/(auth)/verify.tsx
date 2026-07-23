import { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LP } from '@/constants/loginPalette';
import Spinner from '@/components/ui/Loading';

export default function VerifyScreen() {
  useEffect(() => {
    // Show a success message then redirect
    Alert.alert(
      'Email Verified',
      'Your account has been successfully verified. You can now log in.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/') }]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Spinner />
      <Text style={styles.text}>Verifying your account...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LP.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: LP.text,
  },
});
