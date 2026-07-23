import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { z } from 'zod';
import { showAppAlert } from '@/components/ui/AppAlert';
import { usePalette } from '@/constants/usePalette';
import type { Palette } from '@/constants/usePalette';

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

function InputField({
  label, value, onChangeText, placeholder, secureTextEntry = false, error, p,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
  p: Palette;
}) {
  const styles = createStyles(p);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <LinearGradient colors={[p.gradientStart, p.gradientEnd]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.pillGradient}>
        <TextInput
          style={styles.textInput}
          placeholderTextColor={p.placeholder}
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
        />
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function UpdatePasswordScreen() {
  const p = usePalette();
  const styles = createStyles(p);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          setVerifying(false);
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
      } catch {
        showAppAlert({ title: 'Error', message: 'Invalid or expired reset link.', type: 'error' });
        router.replace('/(auth)/forgot-password');
      } finally {
        setVerifying(false);
      }
    };

    handleDeepLink();
  }, []);
  const { control, handleSubmit, formState: { errors } } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        showAppAlert({ title: 'Error', message: error.message, type: 'error' });
      } else {
        showAppAlert({ title: 'Password Updated', message: 'Your password has been successfully updated.', type: 'success', onDismiss: () => router.replace('/') });
      }
    } catch {
      showAppAlert({ title: 'Error', message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.scroll, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={p.gold} />
          <Text style={{ color: p.text, marginTop: 12, fontSize: 15 }}>Verifying your reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <WattWatchLogo showBrandName />

        <View style={styles.formContainer}>
          {([
            { name: 'password', label: 'New Password', placeholder: 'Enter new password', secureTextEntry: true },
            { name: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password', secureTextEntry: true },
          ] as const).map(({ name, label, placeholder, secureTextEntry }) => (
            <Controller
              key={name}
              control={control}
              name={name as any}
              render={({ field: { value, onChange } }) => (
                <InputField
                  label={label}
                  value={value}
                  onChangeText={onChange}
                  placeholder={placeholder}
                  secureTextEntry={secureTextEntry}
                  error={(errors as any)[name]?.message}
                  p={p}
                />
              )}
            />
          ))}

          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[p.gradientStart, p.gradientEnd]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.btnGradient, loading && styles.btnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnText}>Update Password</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  badgeContainer: { marginBottom: 12 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: p.text, letterSpacing: 1.5 },
  formContainer: { width: '100%', gap: 16 },
  fieldWrap: { width: '100%' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: p.text, marginBottom: 6, marginLeft: 4 },
  pillGradient: { borderRadius: 9999, paddingHorizontal: 20, height: 48, justifyContent: 'center' },
  textInput: { fontSize: 14, color: p.inputText, fontWeight: '500' },
  errorText: { fontSize: 11, color: p.error, marginTop: 4, marginLeft: 8 },
  btnWrap: { marginTop: 16, borderRadius: 9999 },
  btnGradient: { borderRadius: 9999, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
