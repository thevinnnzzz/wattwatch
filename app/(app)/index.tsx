import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { showAppAlert } from '@/components/ui/AppAlert';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useActiveRate, useAdminConfig, useBudget, useBudgetAlert, useDashboardStats, useUnreadNotificationsCount, useUserAppliances } from '@/hooks/useSupabaseQuery';
import { generateTips } from '@/lib/energyCalculations';
import { queryClient, queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, PixelRatio, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

const APPLIANCE_ICONS: Record<string, string> = {
  'Air Conditioner (1.0 HP Split-Type)': 'snow-outline',
  'Air Conditioner (1.5 HP Split-Type)': 'snow-outline',
  'Air Conditioner (Window-Type 0.5 HP)': 'snow-outline',
  'Air Conditioner (Window-Type 1.0 HP)': 'snow-outline',
  'Inverter Refrigerator': 'cube-outline',
  'Refrigerator': 'cube-outline',
  'Freezer (Chest/Upright)': 'cube-sharp',
  'Stand Fan': 'sync-outline',
  'Desk Fan': 'sync-outline',
  'Ceiling Fan': 'refresh-circle-outline',
  'Air Purifier': 'leaf-outline',
  'Dehumidifier': 'water-outline',
  'Television (LED 43")': 'tv-outline',
  'Television (LED 55")': 'tv-outline',
  'Television (LED 65")': 'tv-outline',
  'Desktop PC (Gaming)': 'desktop-outline',
  'Desktop PC (Workstation)': 'desktop-outline',
  'Laptop': 'laptop-outline',
  'Gaming Console (PS5/Xbox Series X)': 'game-controller-outline',
  'Wi-Fi Router': 'wifi-outline',
  'CCTV System & NVR': 'videocam-outline',
  'UPS (Uninterruptible Power Supply)': 'battery-charging-outline',
  'Microwave Oven': 'grid-outline',
  'Induction Cooktop': 'flame-outline',
  'Electric Kettle': 'flask-outline',
  'Coffee Maker / Espresso Machine': 'cafe-outline',
  'Dishwasher': 'sparkles-outline',
  'Toaster / OTG': 'square-outline',
  'Blender / Food Processor': 'funnel-outline',
  'Air Fryer': 'fast-food-outline',
  'Rice Cooker': 'restaurant-outline',
  'Washing Machine (Front/Top Load)': 'disc-outline',
  'Clothes Dryer (Tumble)': 'repeat-outline',
  'Vacuum Cleaner': 'hardware-chip-outline',
  'Robot Vacuum': 'radio-button-on-outline',
  'Electric Flat Iron': 'shirt-outline',
  'Garment Steamer': 'cloud-outline',
  'Instant Electric Shower Heater': 'thermometer-outline',
  'Storage Water Heater (Boiler)': 'speedometer-outline',
  'Hair Dryer': 'wind-outline',
  'Hair Straightener': 'options-outline',
  'Water Dispenser (Hot & Cold)': 'invert-mode-outline',
  'Light Bulb (LED)': 'bulb-outline',
  'Aquarium Pump & Heater': 'fish-outline',
  'Electric Gate / Garage Door Motor': 'lock-closed-outline',
};

const categoryIconFallback = (name: string): string | null => {
  return APPLIANCE_ICONS[name] ?? null;
};

export default function DashboardScreen() {
  const { profile, loading: authLoading } = useAuth();
  const { sendLocalNotification } = useNotifications();
  const { data: adminConfigData } = useAdminConfig();
  const adminConfig = adminConfigData?.data;
  const excludeDemo = adminConfig ? !adminConfig.generate_data_enabled : undefined;
  const { data: dashboardData, isLoading: statsLoading, refetch: refetchDashboard } = useDashboardStats(profile?.id ?? '', excludeDemo);
  const { data: budgetData, isLoading: budgetLoading, refetch: refetchBudget } = useBudget(profile?.id ?? '');
  const { data: unreadCountData, refetch: refetchUnread } = useUnreadNotificationsCount(profile?.id ?? '');
  const { data: budgetAlertData, refetch: refetchBudgetAlert } = useBudgetAlert(profile?.id ?? '', excludeDemo);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'consumers' | 'tips'>('consumers');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchBudget(), refetchBudgetAlert(), refetchUnread()]);
    setRefreshing(false);
  }, [refetchDashboard, refetchBudget, refetchBudgetAlert, refetchUnread]);

  const shownAlertKey = useRef<string | null>(null);

  const { width } = useWindowDimensions();
  const p = usePalette();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

  const isSmallScreen = width < 360;
  const isTablet = width >= 768;

  useEffect(() => {
    if (!budgetAlertData) return;
    if (budgetAlertData.type !== 'approaching' && budgetAlertData.type !== 'exceeded') return;

    const key = `${budgetAlertData.type}:${budgetAlertData.spent}:${budgetAlertData.limit}`;
    if (shownAlertKey.current === key) return;
    shownAlertKey.current = key;

    // Create database notification once per alert cycle
    const notifType = budgetAlertData.type === 'exceeded' ? 'budget_exceeded' : 'budget_approaching';
    const title = budgetAlertData.type === 'exceeded' ? 'Budget Exceeded!' : 'Budget Alert';
    supabase
      .from('notifications')
      .delete()
      .eq('user_id', profile?.id ?? '')
      .eq('type', notifType)
      .eq('is_read', false)
      .then(() => {
        supabase.from('notifications').insert({
          user_id: profile?.id ?? '',
          title,
          message: budgetAlertData.message,
          type: notifType,
          is_read: false,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(profile?.id ?? '') });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(profile?.id ?? '') });
        });
      });

    const body = budgetAlertData.message;
    showAppAlert({ title, message: body, type: budgetAlertData.type === 'exceeded' ? 'error' : 'warning' });
    sendLocalNotification(title, body, { url: '/(app)/notifications' });
  }, [budgetAlertData, sendLocalNotification]);

  const stats = dashboardData?.data;
  const budget = budgetData?.data;
  const { data: appliancesData } = useUserAppliances(profile?.id ?? '');
  const { data: rateData } = useActiveRate();
  const appliances = (appliancesData as any)?.data ?? [];
  const rate = (rateData as any)?.data?.rate_per_kwh ?? 12.45;
  const tips = generateTips(appliances, rate);

  const unreadNotifs = unreadCountData ?? 0;

  const budgetSpentPercentage = budget && stats ? (stats.totalCost / budget.monthly_limit) * 100 : 0;

  if (authLoading || statsLoading || budgetLoading) {
    return <Spinner />;
  }

  const styles = createStyles(p, rf, isSmallScreen, isTablet);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.gold} colors={[p.gold]} />}>
        <ThemedView style={styles.container}>
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
              <Pressable onPress={() => router.push('/about')} hitSlop={8}>
                <Image source={require('@/assets/images/icon.png')} style={styles.headerAppIcon} resizeMode="contain" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/notifications')}
                style={{ position: 'relative' }}
                hitSlop={8}
              >
                <Ionicons name="notifications" size={rf(24)} color={p.text} />
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

          <View style={styles.summaryCard}>
            <View style={styles.summaryCardLabelRow}>
              <ThemedText style={styles.summaryCardLabel} maxFontSizeMultiplier={1.3}>
                This Month&rsquo;s Usage
              </ThemedText>
              <Pressable
                onPress={() =>
                  showAppAlert({
                    title: 'How this is calculated',
                    message: [
                      'Total Consumption',
                      'Sum of all kWh consumed this month from your appliances\' energy logs.',
                      '',
                      'Estimated Cost',
                      'Sum of the daily cost (kWh × Meralco rate) for each energy log entry this month.',
                      '',
                      'Top Energy Consumers',
                      'Appliances ranked by their total cost contribution this month.',
                    ].join('\n'),
                    type: 'info',
                  })
                }
                hitSlop={8}
              >
                <Ionicons name="information-circle-outline" size={rf(20)} color="#E5E7EB" />
              </Pressable>
            </View>
            <ThemedText style={styles.rateLabel} maxFontSizeMultiplier={1.2}>
              Rate: ₱{rate.toFixed(4)}/kWh
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

          <View style={styles.sectionContainer}>
            <View style={styles.tabBar}>
              <Pressable
                style={[styles.tab, activeTab === 'consumers' && styles.tabActive]}
                onPress={() => setActiveTab('consumers')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'consumers' && styles.tabTextActive]} maxFontSizeMultiplier={1.2}>
                  Top Consumers
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'tips' && styles.tabActive]}
                onPress={() => setActiveTab('tips')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'tips' && styles.tabTextActive]} maxFontSizeMultiplier={1.2}>
                  Energy Tips
                </ThemedText>
              </Pressable>
            </View>

            {activeTab === 'consumers' ? (
              <View style={[styles.topConsumersContainer, isTablet && styles.topConsumersGrid]}>
                {stats?.topConsumers && stats.topConsumers.length > 0 ? (
                  stats.topConsumers.map((consumer: any, index: number) => {
                    const iconName = consumer.iconName || categoryIconFallback(consumer.name) || 'flash-outline';
                    return (
                    <View
                      key={index}
                      style={[styles.consumerCard, isTablet && styles.consumerCardTablet]}
                    >
                      <View style={styles.consumerLeft}>
                        <View style={[styles.consumerIconWrap, { backgroundColor: p.divider }]}>
                          <Ionicons name={iconName as any} size={rf(18)} color={p.gold} />
                        </View>
                        <ThemedText style={styles.consumerName} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3}>
                          {consumer.name}
                        </ThemedText>
                      </View>
                      <View style={styles.consumerValues}>
                        <ThemedText style={styles.consumerKwh} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                          {consumer.kwh.toFixed(2)} kWh
                        </ThemedText>
                        <ThemedText style={styles.consumerCost} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                          ₱{consumer.cost.toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>
                    );
                  })
                ) : (
                  <ThemedText>No appliance usage recorded yet.</ThemedText>
                )}
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                {appliances.length === 0 ? (
                  <ThemedText>Add appliances to receive personalized energy saving tips.</ThemedText>
                ) : (
                  tips.map((tip, index) => (
                    <View key={index} style={[styles.tipItem, { backgroundColor: p.card }]}>
                      <Ionicons name="bulb-outline" size={rf(20)} color={p.gold} style={{ marginTop: 2 }} />
                      <ThemedText style={styles.tipText} maxFontSizeMultiplier={1.2}>{tip}</ThemedText>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette, rf: (n: number) => number, isSmallScreen: boolean, isTablet: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: p.bg },
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
    headerAppIcon: { width: rf(30), height: rf(30), borderRadius: rf(7) },
    notifBadge: {
      position: 'absolute',
      right: -6,
      top: -4,
      backgroundColor: p.error,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: p.bg,
    },
    notifBadgeText: { color: 'white', fontSize: rf(11), fontWeight: 'bold', textAlign: 'center', lineHeight: rf(14) },
    summaryCard: {
      backgroundColor: p.gradientStart,
      borderRadius: 24,
      padding: isSmallScreen ? Spacing.four : Spacing.five,
      gap: Spacing.three,
    },
    summaryCardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    summaryCardLabel: { color: '#E5E7EB', fontSize: rf(14), lineHeight: rf(18) },
    rateLabel: { color: 'rgba(255,255,255,0.7)', fontSize: rf(12), marginTop: Spacing.one },
    summaryValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: Spacing.four,
      gap: Spacing.three,
    },
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
    progressBarFilled: { backgroundColor: p.gold, height: 8, borderRadius: 4 },
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
      backgroundColor: p.card,
      borderRadius: 12,
      padding: isSmallScreen ? Spacing.two : Spacing.three,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.two,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: p.divider,
      borderRadius: 10,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: p.gold,
    },
    tabText: {
      fontSize: rf(13),
      fontWeight: '600',
      color: p.textMuted,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    tipsContainer: {
      gap: Spacing.two,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.two,
      padding: Spacing.three,
      borderRadius: 12,
    },
    tipText: {
      flex: 1,
      fontSize: rf(14),
      lineHeight: rf(20),
    },
    consumerCardTablet: {
      width: '48%',
    },
    consumerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      flexShrink: 1,
      flex: 1,
      minWidth: 0,
    },
    consumerIconWrap: {
      width: rf(32),
      height: rf(32),
      borderRadius: rf(8),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    consumerName: {
      fontWeight: 'bold',
      fontSize: rf(14),
      color: p.text,
      flexShrink: 1,
      flex: 1,
    },
    consumerValues: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    consumerKwh: {
      fontSize: rf(13),
      color: p.textMuted,
      textAlign: 'right',
    },
    consumerCost: {
      fontSize: rf(13),
      fontWeight: '600',
      color: p.gold,
      textAlign: 'right',
    },
  });
