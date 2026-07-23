import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { z } from 'zod';

// ─── Schema ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Pill Gradient Input Field ──────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}

function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, error, keyboardType, autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <LinearGradient
        colors={['#4A4A4A', '#D4AF37']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.pillGradient}
      >
        <TextInput
          style={styles.textInput}
          placeholderTextColor="#E5E7EB"
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

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        // Hack: slight delay ensures session is persisted, then navigate
        setTimeout(() => {
          router.replace('/(app)/');
        }, 300);
      }
    } catch {
      Alert.alert('Login Error', 'An unexpected error occurred.');
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
        {/* Logo */}
        <WattWatchLogo showBrandName />

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Email Address */}
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Email Address"
                value={value}
                onChangeText={onChange}
                placeholder="Enter your username"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          {/* Password */}
          <View>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <InputField
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            {/* Forgot Password Link */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotLinkWrap}>
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Sign In Pill Button */}
          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A4A4A', '#D4AF37']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.btnGradient, loading && styles.btnDisabled]}
            >
              <Text style={styles.btnText}>
                {loading ? 'Logging in…' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.footerTouch}>
              <Text style={styles.footerLink}>Register Now</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingVertical: 24,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },

  // Form
  formContainer: {
    width: '100%',
    gap: 16,
  },

  // Field
  fieldWrap: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    marginLeft: 4,
  },
  pillGradient: {
    borderRadius: 9999,
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 8,
  },

  // Forgot Password Link
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
  },

  // Button
  btnWrap: {
    marginTop: 16,
    borderRadius: 9999,
  },
  btnGradient: {
    borderRadius: 9999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  footerTouch: {
    marginTop: 4,
  },
  footerLink: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});