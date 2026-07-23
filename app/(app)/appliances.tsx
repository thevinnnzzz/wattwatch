import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAppliance, useUpdateAppliance, useUserAppliances } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Modal, PixelRatio, Pressable, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;
const DELETE_WIDTH = 88;
const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;

function AnimatedSwitch({ value, onValueChange, trackColor }: { value: boolean; onValueChange: () => void; trackColor: string }) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
      mass: 0.3,
    }).start();
  }, [value, animatedValue]);

  const trackBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', trackColor],
  });

  const thumbTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, TRACK_WIDTH - THUMB_SIZE - 2],
  });

  return (
    <TouchableOpacity
      onPress={onValueChange}
      activeOpacity={0.8}
      style={{ padding: 4 }}
    >
      <Animated.View
        style={[
          {
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            justifyContent: 'center',
          },
          { backgroundColor: trackBackground },
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: 'white',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
            },
            { transform: [{ translateX: thumbTranslate }] },
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
  const { mutate: deleteAppliance } = useDeleteAppliance();
  const { mutate: updateAppliance } = useUpdateAppliance();

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
    updateAppliance({ applianceId: appliance.id, updates: { is_active: !appliance.is_active } });
  };

  const renderRightActions = (applianceId: string) => (
    <Pressable
      onPress={() => deleteAppliance(applianceId)}
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

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}
      containerStyle={isTablet ? styles.tabletItemWrapper : styles.mobileItemWrapper}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/(app)/appliance-details', params: { applianceId: item.id } })}
        style={({ pressed }) => [
          styles.applianceCard,
          isTablet && styles.applianceCardTablet,
          !isTablet && { backgroundColor: p.bg },
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.applianceMain}>
          <View style={[styles.statusDot, { backgroundColor: item.is_active ? '#22C55E' : '#9CA3AF' }]} />
          
          <View style={styles.applianceTextWrap}>
            {/* Title and Switch are grouped together to ensure they sit on the exact same horizontal line */}
            <View style={styles.titleRow}>
              <ThemedText style={styles.applianceName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {item.name}
              </ThemedText>
              <AnimatedSwitch
                value={item.is_active}
                onValueChange={() => handleToggleActive(item)}
                trackColor={'#22C55E'}
              />
            </View>
            
            <View style={styles.metaRow}>
              <View style={[styles.metaBadge, { backgroundColor: p.divider }]}>
                <ThemedText style={[styles.metaBadgeText, { color: p.textMuted }]} maxFontSizeMultiplier={1.2}>
                  {item.wattage}W
                </ThemedText>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: p.divider }]}>
                <ThemedText style={[styles.metaBadgeText, { color: p.textMuted }]} maxFontSizeMultiplier={1.2}>
                  {item.hours_used_daily} hrs/day
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
            My Appliances
          </ThemedText>
          <Button title="Add New" size="sm" onPress={() => router.push('/(app)/add-appliance')} />
        </ThemedView>

        {/* Filter & Sort Bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterChips}>
            {(['all', 'active', 'inactive'] as const).map(status => (
              <Pressable
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterChipText,
                    filterStatus === status
                      ? styles.filterChipTextActive
                      : { color: p.textMuted },
                  ]}
                  maxFontSizeMultiplier={1.2}
                >
                  {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setShowSortMenu(true)}
            style={[styles.sortButton, { backgroundColor: p.divider }]}
          >
            <Ionicons name="swap-vertical" size={rf(14)} color={p.textMuted} />
            <ThemedText style={[styles.sortButtonText, { color: p.textMuted }]} maxFontSizeMultiplier={1.2}>
              {sortOptions.find(o => o.value === sortBy)?.label}
            </ThemedText>
            <Ionicons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={rf(12)} color={p.textMuted} />
          </Pressable>
        </View>

        {/* Sort Modal */}
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

        {filteredAndSorted.length === 0 ? (
          <EmptyState
            title={filterStatus === 'all' ? 'No Appliances Found' : 'No Matching Appliances'}
            description={
              filterStatus === 'all'
                ? 'Add your first appliance to start tracking your energy consumption.'
                : 'Try changing the filter to see more appliances.'
            }
            action={
              filterStatus === 'all'
                ? { label: 'Add Appliance', onPress: () => router.push('/(app)/add-appliance') }
                : { label: 'Show All', onPress: () => setFilterStatus('all') }
            }
          />
        ) : (
          <FlatList
            data={filteredAndSorted}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            key={numColumns}
            numColumns={numColumns}
            columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </ThemedView>
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
    container: {
      flex: 1,
      padding: isSmallScreen ? Spacing.three : Spacing.four,
      gap: Spacing.four,
      maxWidth: isTablet ? 900 : undefined,
      width: '100%',
      alignSelf: isTablet ? 'center' : 'stretch',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.three,
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    headerTitle: { 
      fontSize: rf(24), 
      flexShrink: 1 
    },
    listContent: { 
      paddingBottom: Spacing.six ?? 24 
    },
    columnWrapper: { 
      gap: Spacing.three, 
      justifyContent: 'space-between' 
    },
    mobileItemWrapper: {
      marginBottom: 0,
      paddingHorizontal: 0,
    },
    tabletItemWrapper: {
      width: '48%',
      marginBottom: Spacing.three,
    },
    applianceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isSmallScreen ? Spacing.three : Spacing.four,
      paddingHorizontal: isSmallScreen ? Spacing.three : Spacing.four,
      borderBottomWidth: 1,
      borderBottomColor: p.divider,
      minHeight: 72,
    },
    applianceCardTablet: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.divider,
      borderBottomWidth: 1,
      backgroundColor: p.card ?? p.bg,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    applianceMain: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Aligns status dot to the top to match the text line
      flex: 1,
      gap: Spacing.three,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: rf(6), // Fine-tuned to center perfectly with the title text
    },
    applianceTextWrap: {
      flex: 1,
      gap: 6,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.two,
    },
    applianceName: {
      fontWeight: '700',
      fontSize: rf(16),
      flexShrink: 1,
    },
    metaRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      flexWrap: 'wrap',
    },
    metaBadge: {
      paddingHorizontal: rf(8),
      paddingVertical: rf(3),
      borderRadius: 6,
    },
    metaBadgeText: {
      fontSize: rf(11),
      fontWeight: '600',
    },

    deleteButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: DELETE_WIDTH,
      height: '100%',
      borderRadius: 16,
      marginLeft: Spacing.two,
      gap: 4,
    },
    deleteButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: rf(11),
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.two,
      paddingBottom: Spacing.three,
      flexWrap: 'wrap',
    },
    filterChips: {
      flexDirection: 'row',
      gap: 6,
    },
    filterChip: {
      paddingHorizontal: rf(12),
      paddingVertical: rf(6),
      borderRadius: 20,
      backgroundColor: p.divider,
    },
    filterChipActive: {
      backgroundColor: p.navy,
    },
    filterChipText: {
      fontSize: rf(12),
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: 'white',
      fontWeight: '700',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: rf(10),
      paddingVertical: rf(6),
      borderRadius: 20,
    },
    sortButtonText: {
      fontSize: rf(12),
      fontWeight: '600',
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
  });