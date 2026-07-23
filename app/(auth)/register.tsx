import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { z } from 'zod';
import { showAppAlert } from '@/components/ui/AppAlert';
import { usePalette } from '@/constants/usePalette';
import type { Palette } from '@/constants/usePalette';
import * as Linking from 'expo-linking';

const registerSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  p: Palette;
}

function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, error, keyboardType, autoCapitalize, p,
}: FieldProps) {
  const styles = createStyles(p);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <LinearGradient
        colors={[p.gradientStart, p.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.pillGradient}
      >
        <TextInput
          style={styles.textInput}
          placeholderTextColor={p.placeholder}
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterScreen() {
  const p = usePalette();
  const styles = createStyles(p);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
          emailRedirectTo: Linking.createURL('/verify'),
        },
      });
      if (error) {
        showAppAlert({ title: 'Sign Up Failed', message: error.message, type: 'error' });
      } else {
        showAppAlert({ title: 'Sign Up Successful', message: 'Please check your email for a verification link.', type: 'success', onDismiss: () => router.replace('/(auth)/') });
      }
    } catch {
      showAppAlert({ title: 'Sign Up Error', message: 'An unexpected error occurred.', type: 'error' });
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
            { name: 'name', label: 'Full Name', placeholder: 'Juan Dela Cruz', keyboardType: undefined as const, autoCapitalize: 'words' as const, secureTextEntry: false },
            { name: 'email', label: 'Email Address', placeholder: 'you@example.com', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const, secureTextEntry: false },
            { name: 'password', label: 'Password', placeholder: 'Min. 8 characters', keyboardType: undefined as const, autoCapitalize: undefined, secureTextEntry: true },
            { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter your password', keyboardType: undefined as const, autoCapitalize: undefined, secureTextEntry: true },
          ] as const).map(({ name, label, placeholder, keyboardType, autoCapitalize, secureTextEntry }) => (
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
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
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
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/" asChild>
            <TouchableOpacity style={styles.footerTouch}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { color: p.text, fontSize: 12, fontWeight: '500' },
  footerTouch: { marginTop: 4 },
  footerLink: { color: p.text, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
