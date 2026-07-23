import WattWatchLogo from '@/components/layout/WattWatchLogo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Spinner from '@/components/ui/Loading';
import { LP } from '@/constants/loginPalette';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBudget, useBudgetAlert, useDashboardStats, useUnreadNotificationsCount } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, PixelRatio, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Base design width used to scale sizes across phone sizes (small phones -> tablets)
const BASE_WIDTH = 375;

export default function DashboardScreen() {
  const { profile, loading: authLoading } = useAuth();
  useNotifications();
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats(profile?.id ?? '');
  const { data: budgetData, isLoading: budgetLoading } = useBudget(profile?.id ?? '');
  const { data: unreadCountData } = useUnreadNotificationsCount(profile?.id ?? '');
  const { data: budgetAlertData } = useBudgetAlert(profile?.id ?? '');

  const { width } = useWindowDimensions();

  // Clamp scale so it doesn't blow up on tablets or shrink too much on tiny phones
  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

  const isSmallScreen = width < 360;
  const isTablet = width >= 768;

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

  const styles = createStyles(rf, isSmallScreen, isTablet);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <View style={styles.greetingWrap}>
              <ThemedText
                style={styles.greeting}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.3}
              >
                Hi, {profile?.full_name?.split(' ')[0] || 'User'}!
              </ThemedText>
            </View>
            <View style={styles.headerRight}>
              <WattWatchLogo />
              <Pressable
                onPress={() => router.push('/notifications')}
                style={{ position: 'relative' }}
                hitSlop={8}
              >
                <Ionicons name="notifications" size={rf(24)} color={LP.text} />
                {unreadNotifs > 0 && (
                  <View style={styles.notifBadge}>
                    <ThemedText style={styles.notifBadgeText} maxFontSizeMultiplier={1.2}>
                      {unreadNotifs > 99 ? '99+' : unreadNotifs}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          </ThemedView>

          {/* Energy Summary Card */}
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryCardLabel} maxFontSizeMultiplier={1.3}>
              This Month's Usage
            </ThemedText>
            <View style={styles.summaryValues}>
              <View style={styles.summaryColumn}>
                <ThemedText style={styles.summaryCardTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  Total Consumption
                </ThemedText>
                <ThemedText
                  style={styles.summaryAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  maxFontSizeMultiplier={1.3}
                >
                  {stats?.totalKwh.toFixed(2) || 0} kWh
                </ThemedText>
              </View>
              <View style={[styles.summaryColumn, { alignItems: 'flex-end' }]}>
                <ThemedText style={styles.summaryCardTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  Estimated Cost
                </ThemedText>
                <ThemedText
                  style={styles.summaryAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  maxFontSizeMultiplier={1.3}
                >
                  ₱{stats?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </ThemedText>
              </View>
            </View>
            {budget && (
              <>
                <ThemedText style={styles.summaryCardTitle} maxFontSizeMultiplier={1.3}>
                  Budget
                </ThemedText>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFilled, { width: `${Math.min(budgetSpentPercentage, 100)}%` }]} />
                </View>
                <View style={styles.progressLabelContainer}>
                  <ThemedText style={styles.progressLabel} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                    Spent: ₱{stats?.totalCost.toFixed(2) || '0.00'}
                  </ThemedText>
                  <ThemedText style={styles.progressLabel} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                    Limit: ₱{budget.monthly_limit.toLocaleString()}
                  </ThemedText>
                </View>
              </>
            )}
          </View>

          {/* Top Consumers */}
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Top Energy Consumers
            </ThemedText>
            <View style={[styles.topConsumersContainer, isTablet && styles.topConsumersGrid]}>
              {stats?.topConsumers && stats.topConsumers.length > 0 ? (
                stats.topConsumers.map((consumer: any, index: number) => (
                  <View
                    key={index}
                    style={[styles.consumerCard, isTablet && styles.consumerCardTablet]}
                  >
                    <ThemedText style={styles.consumerName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                      {consumer.name}
                    </ThemedText>
                    <ThemedText style={styles.consumerKwh} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                      {consumer.kwh.toFixed(2)} kWh
                    </ThemedText>
                    <ThemedText style={styles.consumerCost} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                      ₱{consumer.cost.toFixed(2)}
                    </ThemedText>
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

const createStyles = (rf: (n: number) => number, isSmallScreen: boolean, isTablet: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: LP.bg },
    scrollContent: { flexGrow: 1 },
    container: {
      flex: 1,
      padding: isSmallScreen ? Spacing.three : Spacing.four,
      gap: Spacing.four,
      maxWidth: isTablet ? 700 : undefined,
      width: '100%',
      alignSelf: isTablet ? 'center' : 'stretch',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    greetingWrap: { flexShrink: 1, minWidth: 0, marginRight: Spacing.two },
    greeting: { fontSize: rf(24), fontWeight: 'bold', lineHeight: rf(30) },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, flexShrink: 0 },
    notifBadge: {
      position: 'absolute',
      right: -6,
      top: -3,
      backgroundColor: LP.error,
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: LP.bg,
    },
    notifBadgeText: { color: 'white', fontSize: rf(10), fontWeight: 'bold' },
    summaryCard: {
      backgroundColor: LP.gradientStart,
      borderRadius: 24,
      padding: isSmallScreen ? Spacing.four : Spacing.five,
      gap: Spacing.three,
    },
    summaryCardLabel: { color: '#E5E7EB', fontSize: rf(14), lineHeight: rf(18) },
    summaryValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: Spacing.four,
      gap: Spacing.three,
    },
    // fixed width column with its own vertical rhythm — this is what
    // stops "Total Consumption" from colliding with "106.34 kWh"
    summaryColumn: { flexShrink: 1, minWidth: 0, maxWidth: '48%', gap: 4 },
    summaryCardTitle: { color: 'white', fontSize: rf(16), lineHeight: rf(20) },
    summaryAmount: {
      color: 'white',
      fontSize: rf(isSmallScreen ? 24 : 30),
      fontWeight: 'bold',
      lineHeight: rf(isSmallScreen ? 30 : 36),
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 4,
      marginTop: Spacing.two,
    },
    progressBarFilled: { backgroundColor: LP.gold, height: 8, borderRadius: 4 },
    progressLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    progressLabel: { color: '#E5E7EB', fontSize: rf(12) },
    sectionContainer: { gap: Spacing.three },
    sectionTitle: { fontSize: rf(18), fontWeight: 'bold' },
    topConsumersContainer: { gap: Spacing.two },
    topConsumersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    consumerCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: isSmallScreen ? Spacing.two : Spacing.three,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    consumerCardTablet: {
      width: '48%',
    },
    // explicit dark colors instead of relying on ThemedText's theme
    // color (which is tuned for the dark navy background, not this
    // white card — that's why the text looked washed out)
    consumerName: {
      fontWeight: 'bold',
      fontSize: rf(14),
      color: '#111827',
      flexShrink: 1,
      marginRight: Spacing.two,
    },
    consumerKwh: {
      fontSize: rf(13),
      color: '#4B5563',
    },
    consumerCost: {
      fontSize: rf(13),
      fontWeight: '600',
      color: LP.gold,
    },
  });