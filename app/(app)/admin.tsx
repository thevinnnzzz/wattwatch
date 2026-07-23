import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { showAppAlert } from '@/components/ui/AppAlert';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRate, useActiveRatePlan, useAdminConfig, useUpdateAdminConfig, useUpdateRate } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { PixelRatio, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

export default function AdminScreen() {
  const { profile, loading: authLoading } = useAuth();
  const p = usePalette();
  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);
  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
  const isTablet = width >= 768;

  const { data: adminConfigData, isLoading: configLoading, refetch: refetchAdminConfig } = useAdminConfig();
  const { data: ratePlanData, isLoading: ratePlanLoading, refetch: refetchRatePlan } = useActiveRatePlan();
  const { data: rateData, refetch: refetchRate } = useActiveRate();
  const { mutate: updateConfig, isPending: configUpdating } = useUpdateAdminConfig();
  const { mutate: updateRate, isPending: rateUpdating } = useUpdateRate();

  const adminConfig = (adminConfigData as any)?.data;
  const ratePlan = (ratePlanData as any)?.data;
  const currentRate = (rateData as any)?.data?.rate_per_kwh;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAdminConfig(), refetchRatePlan(), refetchRate()]);
    setRefreshing(false);
  }, [refetchAdminConfig, refetchRatePlan, refetchRate]);

  const [newRate, setNewRate] = useState(currentRate?.toString() ?? '12.45');
  const generateDataEnabled = adminConfig?.generate_data_enabled ?? true;

  const isAdmin = profile?.role === 'admin';

  const handleToggleGenerateData = () => {
    if (!profile) return;
    (updateConfig as any)(
      { generateDataEnabled: !generateDataEnabled, adminId: profile.id },
      {
        onSuccess: () => {
          showAppAlert({ title: 'Updated', message: `Data generation is now ${!generateDataEnabled ? 'enabled' : 'disabled'}.`, type: 'success' });
        },
        onError: () => {
          showAppAlert({ title: 'Error', message: 'Failed to update setting.', type: 'error' });
        },
      }
    );
  };

  const handleUpdateRate = () => {
    if (!ratePlan) {
      showAppAlert({ title: 'Error', message: 'No active rate plan found.', type: 'error' });
      return;
    }
    const val = parseFloat(newRate);
    if (isNaN(val) || val <= 0) {
      showAppAlert({ title: 'Invalid', message: 'Please enter a valid rate greater than 0.', type: 'warning' });
      return;
    }
    (updateRate as any)(
      { rateId: ratePlan.id, ratePerKwh: val },
      {
        onSuccess: () => {
          showAppAlert({ title: 'Updated', message: `Rate per kWh updated to ₱${val.toFixed(4)}.`, type: 'success' });
        },
        onError: () => {
          showAppAlert({ title: 'Error', message: 'Failed to update rate.', type: 'error' });
        },
      }
    );
  };

  if (authLoading || configLoading || ratePlanLoading) {
    return <Spinner />;
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
        <ThemedView style={{ flex: 1, padding: Spacing.four, gap: Spacing.four }}>
          <ThemedText type="title">Access Denied</ThemedText>
          <ThemedText style={{ color: p.textMuted, marginTop: Spacing.two }}>
            You do not have admin permissions.
          </ThemedText>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const styles = createStyles(p, rf, isTablet);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.gold} colors={[p.gold]} />}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.screenTitle}>Admin Panel</ThemedText>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag-outline" size={rf(20)} color={p.navy} />
              <ThemedText style={styles.cardTitle}>Rate per kWh</ThemedText>
            </View>
            <ThemedText style={styles.cardDescription}>
              Current rate: ₱{currentRate?.toFixed(4) ?? '12.4500'} per kWh
            </ThemedText>
            <View style={styles.rateInputRow}>
              <TextInput
                style={styles.rateInput}
                value={newRate}
                onChangeText={setNewRate}
                keyboardType="decimal-pad"
                placeholder="e.g. 12.45"
                placeholderTextColor={p.textMuted}
              />
              <Button
                title="Update Rate"
                size="sm"
                onPress={handleUpdateRate}
                loading={rateUpdating}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={rf(20)} color={p.navy} />
              <ThemedText style={styles.cardTitle}>Data Generation</ThemedText>
            </View>
            <ThemedText style={styles.cardDescription}>
              Allow users to generate demo energy data from the Analytics screen.
            </ThemedText>
            <View style={styles.toggleRow}>
              <ThemedText style={{ fontSize: rf(15), color: p.text }}>
                {generateDataEnabled ? 'Enabled' : 'Disabled'}
              </ThemedText>
              <Pressable
                style={[styles.toggleSwitch, generateDataEnabled && styles.toggleSwitchOn]}
                onPress={handleToggleGenerateData}
              >
                <View style={[styles.toggleThumb, generateDataEnabled && styles.toggleThumbOn]} />
              </Pressable>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette, rf: (n: number) => number, isTablet: boolean) => StyleSheet.create({
  scrollContent: { flexGrow: 1 },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: rf(18),
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: rf(14),
    color: p.textMuted,
    lineHeight: rf(20),
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: p.divider,
    borderRadius: 8,
    padding: 10,
    fontSize: rf(15),
    color: p.text,
    backgroundColor: p.bg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: p.divider,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: p.navy,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: p.card ?? '#FFFFFF',
    elevation: 1,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
});