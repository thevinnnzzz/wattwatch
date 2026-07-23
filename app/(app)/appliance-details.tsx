import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import ApplianceForm from '@/components/energy/ApplianceForm';
import { useAppliance, useUpdateAppliance } from '@/hooks/useSupabaseQuery';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import Spinner from '@/components/ui/Loading';

export default function ApplianceDetailsScreen() {
  const { applianceId } = useLocalSearchParams<{ applianceId: string }>();
  const [loading, setLoading] = useState(false);
  const { data: applianceData, isLoading: applianceLoading } = useAppliance(applianceId ?? '');
  const { mutate: updateAppliance } = useUpdateAppliance();

  const appliance = applianceData?.data;

  const onSubmit = (data: any) => {
    if (!applianceId) return;
    setLoading(true);
    updateAppliance(
      { applianceId, updates: data },
      {
        onSuccess: () => {
          setLoading(false);
          Alert.alert('Success', 'Appliance updated successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          setLoading(false);
          Alert.alert('Error', error.message);
        },
      }
    );
  };

  if (applianceLoading) {
    return <Spinner />;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Appliance Details' }} />
      <ApplianceForm onSubmit={onSubmit} loading={loading} initialData={appliance} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
});
