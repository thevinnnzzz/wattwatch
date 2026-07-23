
import { showAppAlert } from '@/components/ui/AppAlert';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginForm = z.infer<typeof loginSchema>;

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

export default function LoginScreen() {
  const p = usePalette();
  const styles = createStyles(p);
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
        showAppAlert({ title: 'Login Failed', message: error.message, type: 'error' });
      } else {
        showAppAlert({ title: 'Welcome Back', message: 'You have signed in successfully.', type: 'success', onDismiss: () => router.replace('/(app)/') });
      }
    } catch {
      showAppAlert({ title: 'Login Error', message: 'An unexpected error occurred.', type: 'error' });
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
                placeholder="Enter your username"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                p={p}
              />
            )}
          />

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
                  p={p}
                />
              )}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotLinkWrap}>
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>
          </View>

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
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
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

const createStyles = (p: Palette) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: p.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingVertical: 24,
  },
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
  formContainer: {
    width: '100%',
    gap: 16,
  },
  fieldWrap: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: p.text,
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
    color: p.inputText,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: p.error,
    marginTop: 4,
    marginLeft: 8,
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: p.text,
    textDecorationLine: 'underline',
  },
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
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: p.text,
    fontSize: 12,
    fontWeight: '500',
  },
  footerTouch: {
    marginTop: 4,
  },
  footerLink: {
    color: p.text,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
