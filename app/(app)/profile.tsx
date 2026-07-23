import FormField from '@/components/forms/FormField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { showAppAlert } from '@/components/ui/AppAlert';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useBudget, useUpdateBudget } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PixelRatio, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

export default function ProfileScreen() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { data: budgetData, isLoading: budgetLoading } = useBudget(profile?.id ?? '');
  const { mutate: updateBudget } = useUpdateBudget();
  const { sendLocalNotification } = useNotifications();
  const p = usePalette();

  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
  const isTablet = width >= 768;

  const budget = budgetData?.data;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
      monthly_limit: budget?.monthly_limit || 5000,
      alert_threshold_pct: budget?.alert_threshold_pct || 80,
    }
  });

  // Ensure form updates if budget data loads after the component mounts
  useEffect(() => {
    if (budget) {
      reset({
        full_name: profile?.full_name || '',
        monthly_limit: budget.monthly_limit,
        alert_threshold_pct: budget.alert_threshold_pct,
      });
    }
  }, [budget, profile, reset]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await signOut();
    showAppAlert({ title: 'Signed Out', message: 'You have been logged out successfully.', type: 'success' });
  };

  const onSaveProfile = async (data: any) => {
    if (!profile) return;

    if (data.full_name !== profile.full_name) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', profile.id);
      if (error) {
        showAppAlert({ title: 'Error', message: 'Failed to update name', type: 'error' });
        sendLocalNotification('Error', 'Failed to update name', { url: '/(app)/notifications' });
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(profile.id) });
    }

    if (budget) {
      updateBudget({ budgetId: budget.id, updates: { monthly_limit: data.monthly_limit, alert_threshold_pct: data.alert_threshold_pct } });
    }

    showAppAlert({ title: 'Saved', message: 'Profile updated successfully', type: 'success' });
    sendLocalNotification('Saved', 'Profile updated successfully', { url: '/(app)/notifications' });
  };

  if (loading || budgetLoading) {
    return <Spinner />;
  }

  const styles = createStyles(p, rf, isTablet);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.gold} colors={[p.gold]} />
        }
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.screenTitle} maxFontSizeMultiplier={1.3}>
            My Profile
          </ThemedText>

          {/* Profile Header Card */}
          {profile && (
            <View style={[styles.card, styles.profileHeader]}>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.profileName} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {profile.full_name?.split(' ')[0] || 'Guest'}
                </ThemedText>
                <ThemedText style={[styles.profileEmail, { color: p.textMuted }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {user?.email || 'No email provided'}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Display Name */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={rf(20)} color={p.primary} />
              <ThemedText style={styles.cardTitle} maxFontSizeMultiplier={1.2}>Display Name</ThemedText>
            </View>
            <View style={styles.formContent}>
              <FormField control={control} name="full_name" title="Full Name" autoCapitalize="words" />
            </View>
          </View>

          {/* Budget Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet-outline" size={rf(20)} color={p.primary} />
              <ThemedText style={styles.cardTitle} maxFontSizeMultiplier={1.2}>Monthly Budget</ThemedText>
            </View>
            <View style={styles.formContent}>
              <FormField control={control} name="monthly_limit" title="Monthly Limit (₱)" keyboardType="numeric" />
              <FormField control={control} name="alert_threshold_pct" title="Alert Threshold (%)" keyboardType="numeric" />
            </View>
          </View>

          <Button title="Save Changes" onPress={handleSubmit(onSaveProfile)} />

          {/* Admin Panel */}
          {profile?.role === 'admin' && (
            <View style={styles.actionsSection}>
              <Button title="Admin Panel" variant="outline" onPress={() => router.push('/admin')} />
            </View>
          )}

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <Button title="Logout" variant="destructive" loading={logoutLoading} onPress={handleLogout} />
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette, rf: (n: number) => number, isTablet: boolean) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: isTablet ? 700 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  screenTitle: {
    fontSize: rf(26),
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: p.card ?? p.bg,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: rf(18),
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: rf(14),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: rf(18),
    fontWeight: '700',
  },
  formContent: {
    gap: Spacing.two,
  },
  actionsSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});