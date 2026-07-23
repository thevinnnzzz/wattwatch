import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useUserAppliances, useDeleteAppliance, useUpdateAppliance } from '@/hooks/useSupabaseQuery';
import { router } from 'expo-router';
import { Switch } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { LP } from '@/constants/loginPalette';

export default function AppliancesScreen() {
  const { profile } = useAuth();
  const { data: appliancesData, isLoading } = useUserAppliances(profile?.id ?? '');
  const { mutate: deleteAppliance } = useDeleteAppliance();
  const { mutate: updateAppliance } = useUpdateAppliance();

  const appliances = appliancesData?.data ?? [];

  const handleToggleActive = (appliance: any) => {
    updateAppliance({ applianceId: appliance.id, updates: { is_active: !appliance.is_active } });
  };

  const renderRightActions = (applianceId: string) => {
    return (
      <Pressable onPress={() => deleteAppliance(applianceId)} style={styles.deleteButton}>
        <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Delete</ThemedText>
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <Pressable onPress={() => router.push({ pathname: '/(app)/appliance-details', params: { applianceId: item.id } })}>
        <View style={styles.applianceItem}>
          <View>
            <ThemedText style={{ fontWeight: 'bold' }}>{item.name}</ThemedText>
            <ThemedText style={{ fontSize: 13, color: LP.textMuted }}>{item.wattage}W | {item.hours_used_daily} hrs/day</ThemedText>
          </View>
          <Switch value={item.is_active} onValueChange={() => handleToggleActive(item)} />
        </View>
      </Pressable>
    </Swipeable>
  );

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LP.bg }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Appliances</ThemedText>
          <Button title="Add New" size="sm" onPress={() => router.push('/(app)/add-appliance')} />
        </ThemedView>

        {appliances.length === 0 ? (
          <EmptyState
            title="No Appliances Found"
            description="Add your first appliance to start tracking your energy consumption."
            action={{ label: 'Add Appliance', onPress: () => router.push('/(app)/add-appliance') }}
          />
        ) : (
          <FlatList
            data={appliances}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: LP.divider }} />}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.three },
  applianceItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.three, backgroundColor: LP.bg,
  },
  deleteButton: { backgroundColor: LP.error, justifyContent: 'center', alignItems: 'center', width: 100, height: '100%' },
});