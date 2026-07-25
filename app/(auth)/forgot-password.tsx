import { supabase, getPasswordResetRedirectUrl } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { showAppAlert } from '@/components/ui/AppAlert';
import { usePalette } from '@/constants/usePalette';
import type { Palette } from '@/constants/usePalette';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function InputField({
  label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize, p,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const p = usePalette();
  const styles = createStyles(p);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });
      if (error) {
        showAppAlert({ title: 'Error', message: error.message, type: 'error' });
      } else {
        showAppAlert({ title: 'Password Reset Email Sent', message: 'Please check your email for a link to reset your password.', type: 'success', onDismiss: () => router.replace('/(auth)/') });
      }
    } catch {
      showAppAlert({ title: 'Error', message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandWatt}>watt</Text>
            <Text style={styles.brandWatch}>watch</Text>
          </View>
        </View>

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
                p={p}
              />
            )}
          />

          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || cooldown > 0}
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
              ) : cooldown > 0 ? (
                <Text style={styles.btnText}>Resend in {cooldown}s</Text>
              ) : (
                <Text style={styles.btnText}>Send Reset Instructions</Text>
              )}
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

const createStyles = (p: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 24 },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  footer: { alignItems: 'center', marginTop: 40 },
  footerTouch: { marginTop: 4 },
  footerLink: { color: p.text, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
