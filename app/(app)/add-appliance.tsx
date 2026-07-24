import applianceData from '@/assets/mocks/appliances.json';
import ApplianceForm from '@/components/energy/ApplianceForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useCreateAppliance } from '@/hooks/useSupabaseQuery';
import { showAppAlert } from '@/components/ui/AppAlert';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddApplianceScreen() {
  const { profile } = useAuth();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { mutate: createAppliance } = useCreateAppliance();
  const [search, setSearch] = useState('');
  const [selectedAppliance, setSelectedAppliance] = useState<{
    name: string;
    category: string;
    wattage: number;
    icon_name?: string;
  } | null>(null);

  // Responsive Scaling Logic
  const { width } = useWindowDimensions();
  const scale = useMemo(() => {
    const raw = width / 375;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);
  
  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

  const filteredAppliances = useMemo(() => {
    if (!search.trim()) return applianceData;
    const q = search.toLowerCase().trim();
    return applianceData.filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      if (a.aliases?.some((alias: string) => alias.toLowerCase().includes(q))) return true;
      if (a.category?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [search]);

  const handleSelectAppliance = (item: { name: string; watts: number; category?: string; icon?: string }) => {
    setSelectedAppliance({
      name: item.name,
      wattage: item.watts,
      category: item.category ?? item.name.split(' ')[0],
      icon_name: item.icon,
    });
  };

  const onSubmit = (data: any) => {
    if (!profile) return;
    setLoading(true);
    createAppliance(
      { ...data, icon_name: selectedAppliance?.icon_name, user_id: profile.id },
      {
        onSuccess: () => {
          setLoading(false);
          Alert.alert('Success', 'Appliance added successfully.', [
            { text: 'OK', onPress: () => router.navigate('/(app)/appliances') },
          ]);
        },
        onError: (error) => {
          setLoading(false);
          showAppAlert({ title: 'Error', message: error.message, type: 'error' });
        },
      }
    );
  };

  const styles = createStyles(p, rf, insets);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Appliance' }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {!selectedAppliance ? (
            <>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={rf(20)} color={p.textMuted} />
                <TextInput
                  placeholder="Search for an appliance..."
                  placeholderTextColor={p.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  style={[styles.searchInput, { color: p.text }]}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={rf(20)} color={p.textMuted} />
                  </Pressable>
                )}
              </View>

              <ThemedText style={styles.sectionTitle}>
                {search ? 'Search Results' : 'Common Appliances'}
              </ThemedText>

              {/* Common Appliances List */}
              <View style={styles.listContainer}>
                {filteredAppliances.map((item, idx) => {
                  const prev = idx > 0 ? filteredAppliances[idx - 1] : null;
                  const showCategory = !search && item.category && (!prev || prev.category !== item.category);
                  return (
                    <View key={item.name}>
                      {showCategory && (
                        <ThemedText style={styles.categoryLabel}>{item.category}</ThemedText>
                      )}
                      <Pressable
                        style={styles.applianceCard}
                        onPress={() => handleSelectAppliance(item)}
                      >
                        <Ionicons name={item.icon as any} size={28} color={p.gold} />
                        <View style={styles.applianceInfo}>
                          <ThemedText style={styles.applianceName}>{item.name}</ThemedText>
                          <ThemedText style={[styles.applianceWatts, { color: p.textMuted }]}>{item.watts}W</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={p.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {filteredAppliances.length === 0 && (
                <ThemedText style={[styles.noResults, { color: p.textMuted }]}>No appliances found.</ThemedText>
              )}

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: p.divider }]} />
                <ThemedText style={[styles.dividerText, { color: p.textMuted }]}>or enter manually</ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: p.divider }]} />
              </View>

              {/* Manual Form */}
              <ApplianceForm onSubmit={onSubmit} loading={loading} />
            </>
          ) : (
            <>
              {/* Selected Appliance Card */}
              <View style={styles.selectedCard}>
                <View style={styles.selectedInfo}>
                  <ThemedText style={[styles.selectedLabel, { color: p.textMuted }]}>
                    Selected Appliance
                  </ThemedText>
                  <ThemedText style={styles.selectedName}>{selectedAppliance.name}</ThemedText>
                  <View style={styles.wattageBadge}>
                    <ThemedText style={[styles.wattageText, { color: p.gold }]}>
                      {selectedAppliance.wattage}W
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedAppliance(null)}
                  style={({ pressed }) => [
                    styles.changeButton,
                    pressed && styles.changeButtonPressed
                  ]}
                >
                  <Ionicons name="create-outline" size={rf(16)} color={p.text} style={{ marginRight: 4 }} />
                  <ThemedText style={styles.changeButtonText}>Change</ThemedText>
                </Pressable>
              </View>

              <ApplianceForm
                onSubmit={onSubmit}
                loading={loading}
                initialData={selectedAppliance}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const createStyles = (
  p: Palette, 
  rf: (n: number) => number, 
  insets: { top: number; bottom: number }
) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    // Dynamically uses insets.top with a safe fallback padding to clear camera cutouts
    paddingTop: Math.max(insets.top, Spacing.four) + Spacing.two,
    paddingBottom: Math.max(insets.bottom, Spacing.four) * 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.card,
    borderRadius: rf(12),
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
    height: rf(48),
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: p.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: rf(15),
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  categoryLabel: {
    fontSize: rf(13),
    fontWeight: '700',
    color: p.text,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    gap: Spacing.two,
  },
  applianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: p.card,
    borderRadius: 12,
    gap: Spacing.three,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  applianceInfo: {
    flex: 1,
    gap: 2,
  },
  applianceName: {
    fontWeight: '600',
    fontSize: 15,
  },
  applianceWatts: {
    fontSize: 12,
  },
  noResults: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
  },
  selectedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: p.card,
    borderRadius: rf(16),
    marginBottom: Spacing.four,
    borderWidth: 1.5,
    borderColor: p.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedInfo: {
    flex: 1,
    gap: 4,
  },
  selectedLabel: {
    fontSize: rf(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedName: {
    fontWeight: '700',
    fontSize: rf(18),
  },
  wattageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: p.divider,
    marginTop: 4,
  },
  wattageText: {
    fontSize: rf(13),
    fontWeight: '600',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: p.card,
    borderWidth: 1,
    borderColor: p.divider,
    borderRadius: rf(10),
  },
  changeButtonPressed: {
    opacity: 0.7,
  },
  changeButtonText: {
    fontSize: rf(14),
    fontWeight: '600',
  },
});