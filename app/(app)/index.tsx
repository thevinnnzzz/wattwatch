import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Spinner from '@/components/ui/Loading';
import { LP } from '@/constants/loginPalette';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useBudget, useBudgetAlert, useDashboardStats, useUnreadNotificationsCount } from '@/hooks/useSupabaseQuery';
import type { BudgetAlert } from '@/services/budgetService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

export default function DashboardScreen() {
  const { profile, loading: authLoading } = useAuth();
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats(profile?.id ?? '');
  const { data: budgetData, isLoading: budgetLoading } = useBudget(profile?.id ?? '');
  const { data: unreadCountData } = useUnreadNotificationsCount(profile?.id ?? '');
  const { data: budgetAlertData } = useBudgetAlert(profile?.id ?? '');

  useEffect(() => {
    if (budgetAlertData && (budgetAlertData.type === 'approaching' || budgetAlertData.type === 'exceeded')) {
      Alert.alert(
        budgetAlertData.type === 'approaching' ? 'Budget Alert' : 'Budget Exceeded!',
        budgetAlertData.message
      );
    }
  }, [budgetAlertData]);

  const stats = dashboardData?.data;
  const budget = budgetData?.data;
  const unreadNotifs = unreadCountData ?? 0;

  const budgetSpentPercentage = budget && stats ? (stats.totalCost / budget.monthly_limit) * 100 : 0;

  if (authLoading || statsLoading || budgetLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>Hi, {profile?.full_name?.split(' ')[0] || 'User'}!</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <WattWatchLogo />
              <Pressable onPress={() => router.push('/notifications')} style={{ position: 'relative' }}>
                <Ionicons name="notifications" size={24} color={LP.text} />
                {unreadNotifs > 0 && (
                  <View style={styles.notifBadge}>
                    <ThemedText style={styles.notifBadgeText}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          </ThemedView>

          {/* Energy Summary Card */}
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryCardLabel}>This Month's Usage</ThemedText>
            <View style={styles.summaryValues}>
              <View>
                <ThemedText style={styles.summaryCardTitle}>Total Consumption</ThemedText>
                <ThemedText style={styles.summaryAmount}>{stats?.totalKwh.toFixed(2) || 0} kWh</ThemedText>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <ThemedText style={styles.summaryCardTitle}>Estimated Cost</ThemedText>
                <ThemedText style={styles.summaryAmount}>₱{stats?.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</ThemedText>
              </View>
            </View>
            {budget && (
              <>
                <ThemedText style={styles.summaryCardTitle}>Budget</ThemedText>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFilled, { width: `${Math.min(budgetSpentPercentage, 100)}%` }]} />
                </View>
                <View style={styles.progressLabelContainer}>
                  <ThemedText style={styles.progressLabel}>Spent: ₱{stats?.totalCost.toFixed(2) || '0.00'}</ThemedText>
                  <ThemedText style={styles.progressLabel}>Limit: ₱{budget.monthly_limit.toLocaleString()}</ThemedText>
                </View>
              </>
            )}
          </View>

          {/* Top Consumers */}
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Top Energy Consumers</ThemedText>
            <View style={styles.topConsumersContainer}>
              {stats?.topConsumers && stats.topConsumers.length > 0 ? (
                stats.topConsumers.map((consumer: any, index: number) => (
                  <View key={index} style={styles.consumerCard}>
                    <ThemedText style={{fontWeight: 'bold'}}>{consumer.name}</ThemedText>
                    <ThemedText>{consumer.kwh.toFixed(2)} kWh</ThemedText>
                    <ThemedText style={{color: LP.gold}}>₱{consumer.cost.toFixed(2)}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText>No appliance usage recorded yet.</ThemedText>
              )}
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LP.bg },
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  notifBadge: {
    position: 'absolute',
    right: -6, top: -3,
    backgroundColor: LP.error,
    borderRadius: 9,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LP.bg,
  },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: LP.gradientStart,
    borderRadius: 24,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  summaryCardLabel: { color: '#E5E7EB', fontSize: 14 },
  summaryValues: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.four },
  summaryCardTitle: { color: 'white', fontSize: 16 },
  summaryAmount: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  progressBarContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: Spacing.two },
  progressBarFilled: { backgroundColor: LP.gold, height: 8, borderRadius: 4 },
  progressLabelContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#E5E7EB', fontSize: 12 },
  sectionContainer: { gap: Spacing.three },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  topConsumersContainer: { gap: Spacing.two },
  consumerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});
