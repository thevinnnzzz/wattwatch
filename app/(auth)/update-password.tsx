import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { z } from 'zod';
import { LP, GRADIENT } from '@/constants/loginPalette';

// ─── Schema ─────────────────────────────────────────────────────────────────
const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

// ─── Pill Gradient Input ────────────────────────────────────────────────────
function InputField({
  label, value, onChangeText, placeholder, secureTextEntry = false, error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.pillGradient}>
        <TextInput
          style={styles.textInput}
          placeholderTextColor={LP.placeholder}
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

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function UpdatePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Updated',
          'Your password has been successfully updated.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
              colors={GRADIENT}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.btnGradient, loading && styles.btnDisabled]}
            >
              <Text style={styles.btnText}>
                {loading ? 'Updating…' : 'Update Password'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LP.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  badgeContainer: { marginBottom: 12 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: LP.text, letterSpacing: 1.5 },
  formContainer: { width: '100%', gap: 16 },
  fieldWrap: { width: '100%' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: LP.text, marginBottom: 6, marginLeft: 4 },
  pillGradient: { borderRadius: 9999, paddingHorizontal: 20, height: 48, justifyContent: 'center' },
  textInput: { fontSize: 14, color: LP.inputText, fontWeight: '500' },
  errorText: { fontSize: 11, color: LP.error, marginTop: 4, marginLeft: 8 },
  btnWrap: { marginTop: 16, borderRadius: 9999 },
  btnGradient: { borderRadius: 9999, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: LP.inputText, fontSize: 15, fontWeight: '700' },
});