import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { z } from 'zod';
import { LP, GRADIENT } from '@/constants/loginPalette';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function InputField({
  label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: '/(auth)/update-password',
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Reset Email Sent',
          'Please check your email for a link to reset your password.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/') }]
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
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Email Address"
                value={value}
                onChangeText={onChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

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
                {loading ? 'Sending…' : 'Send Reset Instructions'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/" asChild>
            <TouchableOpacity style={styles.footerTouch}>
              <Text style={styles.footerLink}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  footer: { alignItems: 'center', marginTop: 40 },
  footerTouch: { marginTop: 4 },
  footerLink: { color: LP.text, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});