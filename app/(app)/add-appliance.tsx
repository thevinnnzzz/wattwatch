import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable, TextInput } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import ApplianceForm from '@/components/energy/ApplianceForm';
import { useCreateAppliance } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/hooks/useAuth';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LP } from '@/constants/loginPalette';
import appliances from '@/assets/mocks/appliances.json';

export default function AddApplianceScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { mutate: createAppliance } = useCreateAppliance();
  const [search, setSearch] = useState('');
  const [selectedAppliance, setSelectedAppliance] = useState<{
    name: string;
    category: string;
    wattage: number;
  } | null>(null);

  const filteredAppliances = useMemo(() => {
    if (!search.trim()) return appliances;
    return appliances.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSelectAppliance = (item: { name: string; watts: number }) => {
    setSelectedAppliance({
      name: item.name,
      wattage: item.watts,
      category: item.name.split(' ')[0],
    });
  };

  const onSubmit = (data: any) => {
    if (!profile) return;
    setLoading(true);
    createAppliance(
      { ...data, user_id: profile.id },
      {
        onSuccess: () => {
          setLoading(false);
          Alert.alert('Success', 'Appliance added successfully.', [
            { text: 'OK', onPress: () => router.navigate('/(app)/appliances') },
          ]);
        },
        onError: (error) => {
          setLoading(false);
          Alert.alert('Error', error.message);
        },
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Appliance' }} />

      {!selectedAppliance ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={LP.textMuted} />
            <TextInput
              placeholder="Search for an appliance..."
              placeholderTextColor={LP.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={LP.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Appliance List */}
          <ThemedText style={styles.sectionTitle}>
            {search ? 'Search Results' : 'Common Appliances'}
          </ThemedText>
          <View style={styles.listContainer}>
            {filteredAppliances.map((item) => (
              <Pressable
                key={item.name}
                style={styles.applianceCard}
                onPress={() => handleSelectAppliance(item)}
              >
                <Ionicons name={item.icon as any} size={28} color={LP.gold} />
                <View style={styles.applianceInfo}>
                  <ThemedText style={styles.applianceName}>{item.name}</ThemedText>
                  <ThemedText style={styles.applianceWatts}>{item.watts}W</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={LP.textMuted} />
              </Pressable>
            ))}
          </View>

          {filteredAppliances.length === 0 && (
            <ThemedText style={styles.noResults}>No appliances found.</ThemedText>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or enter manually</ThemedText>
            <View style={styles.dividerLine} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Selected Appliance Card */}
          <View style={styles.selectedCard}>
            <View>
              <ThemedText style={styles.selectedTitle}>Selected:</ThemedText>
              <ThemedText style={styles.selectedName}>{selectedAppliance.name}</ThemedText>
              <ThemedText style={[{ color: LP.textMuted }]}>
                {selectedAppliance.wattage}W
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setSelectedAppliance(null)}
              style={styles.changeButton}
            >
              <ThemedText style={styles.changeButtonText}>Change</ThemedText>
            </Pressable>
          </View>

          <ApplianceForm
            onSubmit={onSubmit}
            loading={loading}
            initialData={selectedAppliance}
          />
        </ScrollView>
      )}

      {/* Manual Form (shown when no appliance is selected) */}
      {!selectedAppliance && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ApplianceForm onSubmit={onSubmit} loading={loading} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
    height: 44,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: LP.divider,
  },
  searchInput: {
    flex: 1,
    color: LP.text,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  listContainer: {
    gap: Spacing.two,
  },
  applianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'white',
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
    color: LP.textMuted,
  },
  noResults: {
    textAlign: 'center',
    color: LP.textMuted,
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
    backgroundColor: LP.divider,
  },
  dividerText: {
    color: LP.textMuted,
    fontSize: 12,
  },
  selectedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: LP.gold,
  },
  selectedTitle: {
    color: LP.textMuted,
    fontSize: 12,
  },
  selectedName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  changeButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderColor: LP.divider,
    borderRadius: 8,
  },
  changeButtonText: {
    color: LP.text,
    fontSize: 13,
  },
});