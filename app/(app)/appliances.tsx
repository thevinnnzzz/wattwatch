import { ThemedText } from '@/components/themed-text';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRate, useDeleteAppliance, useUpdateAppliance, useUserAppliances } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Modal, PixelRatio, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;
const DELETE_WIDTH = 88;

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

const getApplianceIcon = (name: string, dbIcon: string | null): string => {
  return dbIcon || APPLIANCE_ICONS[name] || 'flash-outline';
};

function AnimatedSwitch({ value, onValueChange, trackColor }: { value: boolean; onValueChange: () => void; trackColor: string }) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const TRACK_WIDTH = 44;
  const TRACK_HEIGHT = 24;
  const THUMB_SIZE = 20;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
      mass: 0.3,
    }).start();
  }, [value, animatedValue]);

  return (
    <TouchableOpacity onPress={onValueChange} activeOpacity={0.8} style={{ padding: 4 }}>
      <Animated.View
        style={[
          {
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            justifyContent: 'center',
            backgroundColor: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['#CBD5E1', trackColor],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['#F8FAFC', '#FF8C00'],
              }),
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
            },
            {
              transform: [
                {
                  translateX: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, TRACK_WIDTH - THUMB_SIZE - 2],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AppliancesScreen() {
  const { profile } = useAuth();
  const p = usePalette();
  const { data: appliancesData, isLoading, refetch: refetchAppliances } = useUserAppliances(profile?.id ?? '');
  const { data: rateData } = useActiveRate();
  const { mutate: deleteAppliance } = useDeleteAppliance();
  const { mutate: updateAppliance } = useUpdateAppliance();

  const rate = (rateData as any)?.data?.rate_per_kwh ?? 12.45;

  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

  const isSmallScreen = width < 360;
  const isTablet = width >= 768;
  const numColumns = isTablet ? 2 : 1;

  const styles = useMemo(() => createStyles(rf, isSmallScreen, isTablet, p), [rf, isSmallScreen, isTablet, p]);

  const appliances = appliancesData?.data ?? [];

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAppliances();
    setRefreshing(false);
  }, [refetchAppliances]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'wattage' | 'hours'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionAppliance, setActionAppliance] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let list = [...appliances];

    if (filterStatus === 'active') list = list.filter(a => a.is_active);
    else if (filterStatus === 'inactive') list = list.filter(a => !a.is_active);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'wattage') cmp = a.wattage - b.wattage;
      else if (sortBy === 'hours') cmp = a.hours_used_daily - b.hours_used_daily;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [appliances, filterStatus, sortBy, sortDir]);

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'wattage', label: 'Wattage' },
    { value: 'hours', label: 'Hours/Day' },
  ];

  const handleToggleActive = (appliance: any) => {
    setPendingToggle(appliance);
    setShowToggleConfirm(true);
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    updateAppliance({ applianceId: pendingToggle.id, updates: { is_active: !pendingToggle.is_active } });
    setShowToggleConfirm(false);
    setPendingToggle(null);
  };

  const calcDailyCost = (wattage: number, hours: number): string => {
    const kwh = (wattage * hours) / 1000;
    const cost = kwh * rate;
    return `₱${cost.toFixed(2)}`;
  };

  const renderRightActions = (applianceId: string) => (
    <Pressable
      onPress={() => { setPendingDeleteId(applianceId); setShowDeleteConfirm(true); }}
      style={({ pressed }) => [
        styles.deleteButton,
        { backgroundColor: p.error, opacity: pressed ? 0.8 : 1 },
      ]}
      hitSlop={4}
    >
      <Ionicons name="trash-outline" size={rf(22)} color="white" />
      <ThemedText style={styles.deleteButtonText} maxFontSizeMultiplier={1.2}>
        Delete
      </ThemedText>
    </Pressable>
  );

  const renderItem = ({ item }: { item: any }) => {
    const iconName = getApplianceIcon(item.name, item.icon_name);
    const dailyCost = calcDailyCost(item.wattage, item.hours_used_daily);
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
        containerStyle={isTablet ? styles.tabletItemWrapper : styles.mobileItemWrapper}
      >
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/appliance-details', params: { applianceId: item.id } })}
          onLongPress={() => { setActionAppliance(item); setShowActionMenu(true); }}
          style={({ pressed }) => [
            styles.card,
            pressed && { backgroundColor: p.divider },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={iconName as any} size={rf(24)} color={p.navy} />
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.is_active ? '#22C55E' : '#EF4444',
                  },
                ]}
              />
            </View>

            <View style={styles.infoContainer}>
              <ThemedText
                style={styles.applianceName}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {item.name}
              </ThemedText>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Ionicons name="flash" size={rf(11)} color={p.gold} style={{ marginRight: 3 }} />
                  <ThemedText style={styles.badgeText} maxFontSizeMultiplier={1.2}>
                    {item.wattage}W
                  </ThemedText>
                </View>

                <View style={styles.badge}>
                  <Ionicons name="time-outline" size={rf(11)} color={p.textMuted} style={{ marginRight: 3 }} />
                  <ThemedText style={styles.badgeText} maxFontSizeMultiplier={1.2}>
                    {item.hours_used_daily} hrs/day
                  </ThemedText>
                </View>
              </View>
            </View>

            <AnimatedSwitch
              value={item.is_active}
              onValueChange={() => handleToggleActive(item)}
              trackColor={p.navy}
            />
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerLabel} maxFontSizeMultiplier={1.2}>
              Est. Daily Cost
            </ThemedText>
            <ThemedText style={styles.costValue} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {dailyCost}/day
            </ThemedText>
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const renderListHeader = () => (
    <>
      <View style={styles.headerOuter}>
        <View>
          <ThemedText style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
            My Appliances
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} maxFontSizeMultiplier={1.2}>
            {appliances.length} Devices Registered
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/add-appliance')}
          activeOpacity={0.8}
          style={styles.addButton}
        >
          <Ionicons name="add" size={rf(18)} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText} maxFontSizeMultiplier={1.2}>
            Add New
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.filterGroup}>
          {(['all', 'active', 'inactive'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setFilterStatus(tab)}
              style={[styles.filterChip, filterStatus === tab && styles.filterChipActive]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  filterStatus === tab && styles.filterTextActive,
                ]}
                maxFontSizeMultiplier={1.2}
              >
                {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Inactive'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setShowSortMenu(true)}
          style={styles.sortButton}
        >
          <Ionicons name="swap-vertical" size={rf(14)} color={p.textMuted} />
          <ThemedText style={styles.sortText} maxFontSizeMultiplier={1.2}>
            {sortOptions.find(o => o.value === sortBy)?.label}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="apps-outline" size={rf(48)} color={p.textMuted} />
      <ThemedText style={{ fontWeight: 'bold', fontSize: rf(16), marginTop: Spacing.two }} maxFontSizeMultiplier={1.2}>
        {filterStatus === 'all' ? 'No Appliances Found' : 'No Matching Appliances'}
      </ThemedText>
      <ThemedText style={{ color: p.textMuted, textAlign: 'center', fontSize: rf(14), marginTop: Spacing.one }} maxFontSizeMultiplier={1.2}>
        {filterStatus === 'all'
          ? 'Add your first appliance to start tracking your energy consumption.'
          : 'Try changing the filter to see more appliances.'}
      </ThemedText>
      {filterStatus === 'all' ? (
        <TouchableOpacity
          onPress={() => router.push('/(app)/add-appliance')}
          activeOpacity={0.8}
          style={[styles.addButton, { marginTop: Spacing.four }]}
        >
          <ThemedText style={styles.addButtonText} maxFontSizeMultiplier={1.2}>
            Add Appliance
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setFilterStatus('all')}
          activeOpacity={0.8}
          style={[styles.addButton, { marginTop: Spacing.four }]}
        >
          <ThemedText style={styles.addButtonText} maxFontSizeMultiplier={1.2}>
            Show All
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return <Spinner color={p.gold} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredAndSorted}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.gold} colors={[p.gold]} />}
      />

      <Modal transparent visible={showSortMenu} onRequestClose={() => setShowSortMenu(false)} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.sortMenu, { backgroundColor: p.card ?? p.bg }]}>
            <ThemedText style={styles.sortMenuTitle} maxFontSizeMultiplier={1.3}>Sort by</ThemedText>
            {sortOptions.map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  if (sortBy === opt.value) {
                    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortBy(opt.value);
                    setSortDir('asc');
                  }
                  setShowSortMenu(false);
                }}
                style={[styles.sortMenuItem, sortBy === opt.value && { backgroundColor: p.divider }]}
              >
                <ThemedText
                  style={[
                    styles.sortMenuItemText,
                    sortBy === opt.value && { fontWeight: '700' as const },
                  ]}
                  maxFontSizeMultiplier={1.2}
                >
                  {opt.label}
                </ThemedText>
                {sortBy === opt.value && (
                  <Ionicons
                    name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={rf(16)}
                    color={p.primary}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={showToggleConfirm} animationType="fade" onRequestClose={() => setShowToggleConfirm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowToggleConfirm(false)}>
          <View style={[styles.toggleModalDialog, { backgroundColor: p.card ?? p.bg }]}>
            <Ionicons name={pendingToggle?.is_active ? 'pause-circle-outline' : 'play-circle-outline'} size={48} color={p.gold} />
            <ThemedText style={styles.toggleModalTitle}>
              {pendingToggle?.is_active ? 'Turn Off Appliance?' : 'Turn On Appliance?'}
            </ThemedText>
            <ThemedText style={[styles.toggleModalMessage, { color: p.textMuted }]}>
              {pendingToggle?.is_active
                ? `"${pendingToggle?.name}" will be deactivated. Its data will stop appearing in the dashboard and analytics across the entire app.`
                : `"${pendingToggle?.name}" will be activated. Its data will start appearing in the dashboard and analytics across the entire app.`}
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: p.divider }]}
                onPress={() => { setShowToggleConfirm(false); setPendingToggle(null); }}
              >
                <Text style={[styles.modalButtonText, { color: p.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: pendingToggle?.is_active ? p.error : p.navy }]}
                onPress={confirmToggle}
              >
                <Text style={styles.modalButtonText}>{pendingToggle?.is_active ? 'Turn Off' : 'Turn On'}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={showActionMenu} animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowActionMenu(false)}>
          <View style={[styles.actionMenuDialog, { backgroundColor: p.card ?? p.bg }]}>
            <View style={styles.actionMenuHandle} />
            <ThemedText style={styles.actionMenuTitle}>{actionAppliance?.name}</ThemedText>
            <Pressable
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                if (actionAppliance) router.push({ pathname: '/(app)/appliance-details', params: { applianceId: actionAppliance.id } });
              }}
            >
              <Ionicons name="create-outline" size={rf(22)} color={p.navy} />
              <ThemedText style={styles.actionMenuItemText}>Edit</ThemedText>
            </Pressable>
            <View style={[styles.actionMenuDivider, { backgroundColor: p.divider }]} />
            <Pressable
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                if (actionAppliance) { setPendingDeleteId(actionAppliance.id); setShowDeleteConfirm(true); }
              }}
            >
              <Ionicons name="trash-outline" size={rf(22)} color={p.error} />
              <ThemedText style={[styles.actionMenuItemText, { color: p.error }]}>Delete</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={showDeleteConfirm} animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteConfirm(false)}>
          <View style={[styles.toggleModalDialog, { backgroundColor: p.card ?? p.bg }]}>
            <Ionicons name="warning-outline" size={48} color={p.error} />
            <ThemedText style={styles.toggleModalTitle}>Delete Appliance?</ThemedText>
            <ThemedText style={[styles.toggleModalMessage, { color: p.textMuted }]}>
              This will permanently delete this appliance and all its energy log data from the database.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: p.divider }]}
                onPress={() => { setShowDeleteConfirm(false); setPendingDeleteId(null); }}
              >
                <Text style={[styles.modalButtonText, { color: p.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: p.error }]}
                onPress={() => {
                  if (pendingDeleteId) deleteAppliance(pendingDeleteId);
                  setShowDeleteConfirm(false);
                  setPendingDeleteId(null);
                }}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (
  rf: (n: number) => number,
  isSmallScreen: boolean,
  isTablet: boolean,
  p: any
) =>
  StyleSheet.create({
    headerOuter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.three,
    },
    headerTitle: {
      fontWeight: '800',
      fontSize: rf(24),
      color: p.text,
      flexShrink: 1,
    },
    headerSubtitle: {
      color: p.textMuted,
      fontWeight: '500',
      fontSize: rf(12),
      marginTop: 2,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.gold,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      gap: 4,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: rf(13),
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterGroup: {
      flexDirection: 'row',
      backgroundColor: p.divider,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    filterChipActive: {
      backgroundColor: p.navy,
    },
    filterText: {
      fontWeight: '600',
      fontSize: rf(12),
      color: p.textMuted,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card ?? '#FFFFFF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: p.divider,
      gap: 4,
    },
    sortText: {
      fontWeight: '600',
      fontSize: rf(12),
      color: p.textMuted,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: isSmallScreen ? Spacing.three : Spacing.four,
      paddingBottom: 32,
      gap: 12,
    },
    columnWrapper: {
      gap: 12,
    },
    mobileItemWrapper: {
      marginBottom: 0,
    },
    tabletItemWrapper: {
      width: '48%',
      marginBottom: 0,
    },
    card: {
      backgroundColor: p.card ?? '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: p.divider,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      position: 'relative',
    },
    statusDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      position: 'absolute',
      top: 4,
      right: 4,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    applianceName: {
      fontWeight: '700',
      fontSize: rf(15),
      color: p.text,
      marginBottom: 6,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontWeight: '600',
      fontSize: rf(11),
      color: p.textMuted,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: p.divider,
    },
    footerLabel: {
      color: p.textMuted,
      fontWeight: '500',
      fontSize: rf(11),
    },
    costValue: {
      fontWeight: '700',
      fontSize: rf(13),
      color: p.gold,
    },
    deleteButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: DELETE_WIDTH,
      height: '100%',
      borderRadius: 16,
      marginLeft: 8,
      gap: 4,
    },
    deleteButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: rf(11),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sortMenu: {
      width: 240,
      borderRadius: 16,
      padding: Spacing.four,
      gap: 4,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    sortMenuTitle: {
      fontSize: rf(16),
      fontWeight: '700',
      marginBottom: Spacing.two,
    },
    sortMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      borderRadius: 12,
    },
    sortMenuItemText: {
      fontSize: rf(15),
    },
    toggleModalDialog: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 20,
      padding: Spacing.five,
      alignItems: 'center',
      gap: Spacing.three,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    actionMenuDialog: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 20,
      paddingTop: Spacing.three,
      paddingBottom: Spacing.five,
      paddingHorizontal: Spacing.five,
      alignItems: 'center',
      gap: 0,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    actionMenuHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#D1D5DB',
      marginBottom: Spacing.four,
    },
    actionMenuTitle: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: Spacing.four,
      textAlign: 'center',
    },
    actionMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      paddingVertical: Spacing.three,
      width: '100%',
    },
    actionMenuItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: p.text,
    },
    actionMenuDivider: {
      height: 1,
      width: '100%',
      marginVertical: 0,
    },
    toggleModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    toggleModalMessage: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.three,
      marginTop: Spacing.two,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.eight,
    },
  });
