import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Loading';
import { useBudget, useActiveRate, useUpdateBudget } from '@/hooks/useSupabaseQuery';
import FormField from '@/components/forms/FormField';
import { useForm } from 'react-hook-form';
import { generateTips } from '@/lib/energyCalculations';
import { useUserAppliances } from '@/hooks/useSupabaseQuery';
import { LP } from '@/constants/loginPalette';

export default function ProfileScreen() {
  const { user, profile, loading, signOut } = useAuth();
  const { data: budgetData, isLoading: budgetLoading } = useBudget(profile?.id ?? '');
  const { data: rateData, isLoading: rateLoading } = useActiveRate();
  const { data: appliancesData } = useUserAppliances(profile?.id ?? '');
  const { mutate: updateBudget } = useUpdateBudget();

  const budget = budgetData?.data;
  const rate = rateData?.data?.rate_per_kwh;
  const appliances = appliancesData?.data ?? [];

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      monthly_limit: budget?.monthly_limit || 5000,
      alert_threshold_pct: budget?.alert_threshold_pct || 80,
    }
  });

  const tips = generateTips(appliances, rate || 12.45);

  const handleLogout = async () => {
    await signOut();
  };

  const onUpdateBudget = (data: any) => {
    if (!budget) return;
    updateBudget({ budgetId: budget.id, updates: data });
    Alert.alert('Budget Updated');
  };

  if (loading || budgetLoading || rateLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LP.bg }}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">My Profile</ThemedText>
          </ThemedView>

          {profile && (
            <View style={styles.infoSection}>
              <InfoRow label="Name" value={profile.full_name || 'Not set'} />
              <InfoRow label="Email" value={user?.email || ''} />
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Monthly Budget</ThemedText>
            <FormField control={control} name="monthly_limit" title="Monthly Limit (₱)" keyboardType="numeric" />
            <FormField control={control} name="alert_threshold_pct" title="Alert Threshold (%)" keyboardType="numeric" />
            <Button title="Update Budget" onPress={handleSubmit(onUpdateBudget)} />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Energy Saving Tips</ThemedText>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <ThemedText>{tip}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.actionsSection}>
            <Button title="Logout" variant="destructive" onPress={handleLogout} />
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <ThemedText style={{ fontSize: 13, color: LP.textMuted }}>{label}</ThemedText>
    <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>{value}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.six },
  header: { alignItems: 'center' },
  infoSection: { gap: Spacing.four },
  infoRow: { gap: Spacing.half },
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  actionsSection: { gap: Spacing.three, marginTop: Spacing.four },
  tipCard: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.three,
    borderRadius: 12,
  },
});