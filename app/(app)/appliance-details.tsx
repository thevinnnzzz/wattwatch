import ApplianceForm from '@/components/energy/ApplianceForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';
import { useAppliance, useUpdateAppliance } from '@/hooks/useSupabaseQuery';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { showAppAlert } from '@/components/ui/AppAlert';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

// Helper to determine layout type based on screen width
const useResponsiveLayout = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Tablet breakpoint
  return { isLargeScreen, width };
};

export default function ApplianceDetailsScreen() {
  const { applianceId } = useLocalSearchParams<{ applianceId: string }>();
  const p = usePalette();
  const { isLargeScreen } = useResponsiveLayout();
  
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
          showAppAlert({ title: 'Error', message: error.message, type: 'error' });
        },
      }
    );
  };

  if (applianceLoading) {
    return <Spinner />;
  }

  if (!appliance) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Appliance not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Appliance' }} />
      
      {/* SafeAreaView ensures content stays below notch/status bar */}
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.flex}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[
              styles.mainWrapper, 
              isLargeScreen && styles.largeScreenWrapper
            ]}>
              
              {/* Left Side / Top: Summary Card */}
              <View style={[
                styles.summarySection, 
                isLargeScreen && styles.largeScreenColumn
              ]}>
                <View style={[styles.summaryCard, { borderColor: p.divider }]}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="flash-outline" size={32} color={p.gold} />
                  </View>
                  <View style={styles.summaryInfo}>
                    <ThemedText style={styles.label}>Editing</ThemedText>
                    <ThemedText style={styles.applianceName}>{appliance.name}</ThemedText>
                    <View style={styles.metaRow}>
                      <ThemedText style={[styles.metaText, { color: p.textMuted }]}>
                        {appliance.category || 'Uncategorized'}
                      </ThemedText>
                      <View style={[styles.dot, { backgroundColor: p.textMuted }]} />
                      <ThemedText style={[styles.metaText, { color: p.textMuted }]}>
                        {appliance.wattage}W
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                {/* Optional: Add more stats or info here for large screens */}
                {isLargeScreen && (
                  <View style={styles.infoPlaceholder}>
                    <ThemedText style={[styles.infoText, { color: p.textMuted }]}>
                      Review the details below and update the usage patterns or wattage if necessary. Changes will affect your energy projections immediately.
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Right Side / Bottom: Form */}
              <View style={[
                styles.formSection, 
                isLargeScreen && styles.largeScreenColumn
              ]}>
                <ThemedText style={styles.sectionTitle}>Update Details</ThemedText>
                <ApplianceForm 
                  onSubmit={onSubmit} 
                  loading={loading} 
                  initialData={appliance} 
                  submitButtonText="Save Changes"
                />
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scrollContent: {
    flexGrow: 1,
    // Extra top padding to ensure breathing room even if SafeAreaView behaves differently on some devices
    paddingTop: Spacing.two, 
  },
  // Main Wrapper handles the switch between Column (Mobile) and Row (Tablet)
  mainWrapper: {
    padding: Spacing.four,
    paddingBottom: Spacing.four * 3,
    flexDirection: 'column',
    gap: Spacing.four,
  },
  largeScreenWrapper: {
    flexDirection: 'row',
    maxWidth: 1000, // Prevent stretching on very wide screens
    alignSelf: 'center',
    width: '100%',
    alignItems: 'flex-start',
  },
  summarySection: {
    flex: 1,
  },
  formSection: {
    flex: 1.5, // Give form slightly more space
  },
  largeScreenColumn: {
    // Specific adjustments for columns in row layout
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  summaryInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
    marginBottom: 4,
  },
  applianceName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
  },
  infoPlaceholder: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});