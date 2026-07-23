import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, PixelRatio, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

const STEPS = [
  {
    step: '1',
    title: 'Connect',
    description:
      'Users link compatible smart plugs or manually register appliances.',
  },
  {
    step: '2',
    title: 'Record',
    description:
      "The app records each device's power consumption.",
  },
  {
    step: '3',
    title: 'Calculate',
    description:
      'Estimated electricity costs are computed using local rates.',
  },
  {
    step: '4',
    title: 'Act',
    description:
      'Users view reports, spot high-energy devices, and get tips to save.',
  },
];

export default function AboutScreen() {
  const p = usePalette();
  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
  const isTablet = width >= 768;

  const styles = createStyles(p, rf, isTablet);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          
          {/* Logo Branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.brandRow}>
              <ThemedText style={styles.brandWatt}>watt</ThemedText>
              <ThemedText style={styles.brandWatch}>watch</ThemedText>
            </View>
          </View>

          {/* Subtitle */}
          <ThemedText style={styles.subtitle}>How it works</ThemedText>

          {/* Step Cards List */}
          {STEPS.map((step, index) => (
            <View key={step.step} style={styles.stepWrapper}>
              <View style={styles.card}>
                <View style={styles.badgeContainer}>
                  <View style={styles.numberBadge}>
                    <ThemedText style={styles.badgeText}>{step.step}</ThemedText>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <ThemedText style={styles.cardTitle}>{step.title}</ThemedText>
                  <ThemedText style={styles.cardDescription}>{step.description}</ThemedText>
                </View>
              </View>

              {/* Connecting Down Arrow */}
              {index < STEPS.length - 1 && (
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-down" size={rf(18)} color="#FF5A5F" />
                </View>
              )}
            </View>
          ))}

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette, rf: (n: number) => number, isTablet: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing.five * 2,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
      maxWidth: isTablet ? 600 : undefined,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.two,
      marginBottom: Spacing.two,
    },
    logoBadge: {
      width: rf(80),
      height: rf(80),
      borderRadius: rf(40),
      borderWidth: 4,
      borderColor: '#1E3A8A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.one,
      overflow: 'hidden',
    },
    logoImage: {
      width: rf(72),
      height: rf(72),
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandWatt: {
      fontSize: rf(28),
      fontWeight: '800',
      color: '#1E3A8A',
    },
    brandWatch: {
      fontSize: rf(28),
      fontWeight: '800',
      color: '#FF8C00',
    },
    subtitle: {
      fontSize: rf(20),
      fontWeight: '800',
      textAlign: 'center',
      color: '#111827',
      marginVertical: Spacing.three,
    },
    stepWrapper: {
      alignItems: 'center',
      width: '100%',
    },
    card: {
      flexDirection: 'row',
      backgroundColor: '#273C75',
      borderRadius: 16,
      padding: Spacing.four,
      width: '100%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    badgeContainer: {
      marginRight: Spacing.three,
      justifyContent: 'center',
      alignItems: 'center',
    },
    numberBadge: {
      width: rf(36),
      height: rf(36),
      borderRadius: rf(18),
      backgroundColor: '#FF5A5F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: rf(16),
      fontWeight: '700',
    },
    cardContent: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      fontSize: rf(16),
      fontWeight: '700',
      color: '#FBC531',
      marginBottom: 2,
    },
    cardDescription: {
      fontSize: rf(12),
      color: '#E1E8F0',
      lineHeight: rf(17),
      fontWeight: '400',
    },
    arrowContainer: {
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });