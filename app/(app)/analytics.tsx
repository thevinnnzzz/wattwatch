import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import type { Palette } from '@/constants/usePalette';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRate, useAdminConfig, useEnergyLogs, useGenerateEnergyLogs, useUserAppliances } from '@/hooks/useSupabaseQuery';
import { aggregateEnergyLogs, buildApplianceBreakdown, type AggregatedPoint, type Granularity } from '@/lib/energyCalculations';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { PixelRatio, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

const BASE_WIDTH = 375;

const CHART_COLORS = (p: Palette) => [p.gold, p.navy, '#FBBF24', p.error, '#7C3AED', '#059669', '#DB2777', '#2563EB'];

type MetricMode = 'kWh' | 'cost';
type DateRangeMode = 'preset' | 'custom';

interface ActiveFilters {
  applianceIds: string[];
  categories: string[];
  metric: MetricMode;
  comparisonEnabled: boolean;
  dateRangeMode: DateRangeMode;
  customFrom: string;
  customTo: string;
}

const gatherCategories = (appliances: any[]): string[] => {
  const cats = new Set<string>();
  for (const a of appliances) {
    if (a.category) cats.add(a.category);
  }
  return Array.from(cats).sort();
};

const getPeriodConfig = (granularity: Granularity, customFrom?: string, customTo?: string) => {
  const today = new Date();
  if (customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo), label: 'Custom Range' };
  }
  switch (granularity) {
    case 'daily':
      return { from: subDays(today, 7), to: today, label: 'Last 7 Days' };
    case 'weekly':
      return { from: subDays(today, 12 * 7), to: today, label: 'Last 12 Weeks' };
    case 'monthly':
      return { from: subDays(today, 365), to: today, label: 'Last 12 Months' };
    case 'yearly':
      return { from: subDays(today, 365 * 5), to: today, label: 'Last 5 Years' };
  }
};

const DualAxisChart = ({
  data,
  width = 320,
  height = 220,
  metric,
  p,
  rf,
}: {
  data: AggregatedPoint[];
  width?: number;
  height?: number;
  metric: MetricMode;
  p: Palette;
  rf: (n: number) => number;
}) => {
  if (!data.length) {
    return <ThemedText style={{ textAlign: 'center', padding: 20, color: p.textMuted }}>No data available</ThemedText>;
  }

  const maxPrimary = Math.max(...data.map(d => (metric === 'kWh' ? d.kWh : d.cost)), 1);

  const padding = { top: 10, bottom: 30, left: 48, right: 15 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = Math.max(2, chartW / data.length - 8);

  return (
    <Svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = padding.top + chartH * (1 - pct);
        return (
          <SvgText key={pct} x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={rf(8)} fill={p.textMuted}>
            {metric === 'kWh' ? (maxPrimary * pct).toFixed(1) : `₱${(maxPrimary * pct).toFixed(0)}`}
          </SvgText>
        );
      })}

      {data.map((pt, idx) => {
        const val = metric === 'kWh' ? pt.kWh : pt.cost;
        const barH = maxPrimary > 0 ? (val / maxPrimary) * chartH : 0;
        const x = padding.left + idx * (chartW / data.length) + 4;
        const y = padding.top + chartH - barH;
        return (
          <Rect key={`bar-${idx}`} x={x} y={y} width={barW} height={barH || 1} fill={p.gold} rx={2} opacity={0.85} />
        );
      })}

      {data.map((item, idx) => {
        if (idx === 0) return null;
        const prev = data[idx - 1];
        const getLineVal = (d: AggregatedPoint) => metric === 'kWh' ? d.cost : d.kWh;
        const maxSec = Math.max(...data.map(d => getLineVal(d)), 1);
        const prevX = padding.left + (idx - 1) * (chartW / data.length) + 4 + barW / 2;
        const prevY = padding.top + chartH - (getLineVal(prev) / maxSec) * chartH;
        const currX = padding.left + idx * (chartW / data.length) + 4 + barW / 2;
        const currY = padding.top + chartH - (getLineVal(item) / maxSec) * chartH;
        return (
          <G key={`line-${idx}`}>
            <Line x1={prevX} y1={prevY} x2={currX} y2={currY} stroke={p.navy} strokeWidth={2} />
            <Circle cx={currX} cy={currY} r={3} fill={p.navy} />
          </G>
        );
      })}

      {data.filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 7) === 0).map((item, idx) => {
        const realIdx = data.findIndex(d => d.key === item.key);
        const x = padding.left + realIdx * (chartW / data.length) + 4 + barW / 2;
        return (
          <SvgText key={`x-${idx}`} x={x} y={height - 6} textAnchor="middle" fontSize={rf(9)} fill={p.textMuted}>
            {item.label}
          </SvgText>
        );
      })}
    </Svg>
  );
};

const SimplePieChart = ({ data, p, rf }: { data: { label: string; value: number; color: string }[]; p: Palette; rf: (n: number) => number }) => {
  if (!data.length) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return <ThemedText style={{ textAlign: 'center', padding: 20, color: p.textMuted }}>No consumption data</ThemedText>;

  const chartSize = 180;
  const radius = chartSize / 2 - 10;
  const center = chartSize / 2;
  let cumulativeAngle = 0;

  return (
    <View style={{ alignItems: 'center', gap: Spacing.two }}>
      <Svg width={chartSize} height={chartSize}>
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = cumulativeAngle;
          cumulativeAngle += angle;
          const endAngle = cumulativeAngle;

          if (angle >= 360) {
            return (
              <G key={index}>
                <Circle cx={center} cy={center} r={radius} fill={item.color} />
                <SvgText x={center} y={center + 4} textAnchor="middle" fill="white" fontSize={rf(10)} fontWeight="bold">
                  {Math.round((item.value / total) * 100)}%
                </SvgText>
              </G>
            );
          }

          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;
          const startX = center + radius * Math.cos(startRad);
          const startY = center + radius * Math.sin(startRad);
          const endX = center + radius * Math.cos(endRad);
          const endY = center + radius * Math.sin(endRad);
          const largeArc = angle > 180 ? 1 : 0;
          const d = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

          const midAngle = (startAngle + endAngle) / 2;
          const midRad = (midAngle - 90) * Math.PI / 180;
          const labelX = center + (radius * 0.65) * Math.cos(midRad);
          const labelY = center + (radius * 0.65) * Math.sin(midRad);

          return (
            <G key={index}>
              <Path d={d} fill={item.color} />
              {angle > 15 && (
                <SvgText x={labelX} y={labelY + 4} textAnchor="middle" fill="white" fontSize={rf(10)} fontWeight="bold">
                  {Math.round((item.value / total) * 100)}%
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {data.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: 2 }} />
            <ThemedText style={{ fontSize: rf(11) }} numberOfLines={1} maxFontSizeMultiplier={1.2}>{item.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

const SummaryCard = ({ label, value, unit, color, p, rf, styles }: any) => (
  <View style={[styles.summaryCard, { borderLeftColor: color }]}>
    <ThemedText style={{ color: p.textMuted, fontSize: rf(11) }} maxFontSizeMultiplier={1.2}>{label}</ThemedText>
    <ThemedText style={{ fontWeight: 'bold', fontSize: rf(18), color }} maxFontSizeMultiplier={1.2}>{value}</ThemedText>
    <ThemedText style={{ color: p.textMuted, fontSize: rf(10) }} maxFontSizeMultiplier={1.2}>{unit}</ThemedText>
  </View>
);

const Chip = ({ label, active, onPress, p, styles }: any) => (
  <Pressable
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <ThemedText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
      {label}
    </ThemedText>
    {active && <Ionicons name="close" size={14} color="white" />}
  </Pressable>
);

export default function AnalyticsScreen() {
  const { profile } = useAuth();
  const p = usePalette();
  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
  const isTablet = width >= 768;
  
  // Calculate dynamic chart width safely
  const chartWidth = useMemo(() => {
    const padding = isTablet ? 800 : width; // 800 is tablet max width
    const containerPadding = 32; // Spacing.four * 2
    const cardPadding = 32; // Spacing.four * 2
    return Math.min(padding - containerPadding - cardPadding, 600);
  }, [width, isTablet]);

  const [refreshing, setRefreshing] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const { data: appliancesData } = useUserAppliances(profile?.id ?? '');
  const { data: rateData } = useActiveRate();
  const { mutate: generateLogs, isPending: genLoading } = useGenerateEnergyLogs();

  const { data: adminConfigData } = useAdminConfig();
  const adminConfig = adminConfigData?.data;
  const genDisabled = adminConfig ? !adminConfig.generate_data_enabled : false;

  const appliances = (appliancesData as any)?.data ?? [];
  const rate = (rateData as any)?.data?.rate_per_kwh ?? 12.45;

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    applianceIds: [],
    categories: [],
    metric: 'kWh',
    comparisonEnabled: true,
    dateRangeMode: 'preset',
    customFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    customTo: format(new Date(), 'yyyy-MM-dd'),
  });

  const categories = useMemo(() => gatherCategories(appliances), [appliances]);

  const activeFilterCount =
    filters.applianceIds.length +
    filters.categories.length +
    (filters.dateRangeMode !== 'preset' ? 1 : 0) +
    (filters.metric !== 'kWh' ? 1 : 0) +
    (!filters.comparisonEnabled ? 1 : 0);

  const toggleAppliance = (id: string) => {
    setFilters(prev => {
      const idx = prev.applianceIds.indexOf(id);
      const next = idx >= 0
        ? prev.applianceIds.filter(i => i !== id)
        : [...prev.applianceIds, id];
      return { ...prev, applianceIds: next };
    });
  };

  const toggleCategory = (cat: string) => {
    setFilters(prev => {
      const idx = prev.categories.indexOf(cat);
      const next = idx >= 0
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: next };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      applianceIds: [],
      categories: [],
      metric: 'kWh',
      comparisonEnabled: true,
      dateRangeMode: 'preset',
      customFrom: '',
      customTo: '',
    });
  };

  const periodConfig = getPeriodConfig(
    granularity,
    filters.dateRangeMode === 'custom' ? filters.customFrom : undefined,
    filters.dateRangeMode === 'custom' ? filters.customTo : undefined,
  );
  const fromStr = format(periodConfig.from, 'yyyy-MM-dd');
  const toStr = format(periodConfig.to, 'yyyy-MM-dd');

  const { data: logsData, isLoading, refetch: refetchLogs } = useEnergyLogs(profile?.id ?? '', fromStr, toStr);
  const rawLogs = (logsData as any)?.data ?? [];

  const activeApplianceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of appliances) {
      if (a.is_active) ids.add(a.id);
    }
    return ids;
  }, [appliances]);

  const filteredLogs = useMemo(() => {
    let logs = rawLogs;

    if (genDisabled) {
      logs = logs.filter((l: any) => !l.is_demo);
    }

    logs = logs.filter((l: any) => {
      const id = l.appliance_id ?? l.appliance?.id;
      return id && activeApplianceIds.has(id);
    });

    if (filters.applianceIds.length > 0) {
      logs = logs.filter((l: any) => filters.applianceIds.includes(l.appliance_id ?? l.appliance?.id));
    }

    if (filters.categories.length > 0) {
      logs = logs.filter((l: any) => {
        const cat = l.appliance?.category;
        return cat && filters.categories.includes(cat);
      });
    }

    return logs;
  }, [rawLogs, genDisabled, activeApplianceIds, filters.applianceIds, filters.categories]);

  const aggregated = useMemo(() => {
    if (!filteredLogs.length) return null;
    return aggregateEnergyLogs(filteredLogs, periodConfig.from, periodConfig.to, rate, granularity);
  }, [filteredLogs, granularity, rate]);

  const breakdown = useMemo(() => {
    if (!aggregated) return [];
    return buildApplianceBreakdown(aggregated);
  }, [aggregated]);

  const summary = useMemo(() => {
    if (!aggregated || !aggregated.length) return null;
    const totalKWh = aggregated.reduce((s, p) => s + p.kWh, 0);
    const totalCost = aggregated.reduce((s, p) => s + p.cost, 0);
    const daysWithData = aggregated.filter(p => p.count > 0).length;
    const avgDaily = daysWithData > 0 ? (filters.metric === 'kWh' ? totalKWh : totalCost) / daysWithData : 0;
    const peakDay = aggregated.reduce((max, p) => {
      const val = filters.metric === 'kWh' ? p.kWh : p.cost;
      const maxVal = filters.metric === 'kWh' ? max.kWh : max.cost;
      return val > maxVal ? p : max;
    }, aggregated[0]);
    return { totalKWh, totalCost, avgDaily, peakDay };
  }, [aggregated, filters.metric]);

  const comparison = useMemo(() => {
    if (!filters.comparisonEnabled || !aggregated || aggregated.length < 4) return null;
    const half = Math.floor(aggregated.length / 2);
    const current = aggregated.slice(half);
    const previous = aggregated.slice(0, half);
    const curSum = current.reduce((s, p) => s + p.cost, 0);
    const prevSum = previous.reduce((s, p) => s + p.cost, 0);
    if (!prevSum) return null;
    const changePct = ((curSum - prevSum) / prevSum) * 100;
    return { current: curSum, previous: prevSum, changePct };
  }, [aggregated, filters.comparisonEnabled]);

  const colors = CHART_COLORS(p);
  const pieData = useMemo(() =>
    breakdown.map((b, i) => ({ label: b.name, value: b.cost, color: colors[i % colors.length] })),
    [breakdown, colors]
  );

  const hasData = filteredLogs.length > 0;

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.applianceIds.length === 1) {
      const a = appliances.find((ap: any) => ap.id === filters.applianceIds[0]);
      if (a) parts.push(a.name);
    } else if (filters.applianceIds.length > 1) {
      parts.push(`${filters.applianceIds.length} appliances`);
    }
    if (filters.categories.length === 1) parts.push(filters.categories[0]);
    else if (filters.categories.length > 1) parts.push(`${filters.categories.length} categories`);
    if (filters.dateRangeMode === 'custom') parts.push('Custom dates');
    if (filters.metric === 'cost') parts.push('By cost');
    if (!filters.comparisonEnabled) parts.push('No comparison');
    return parts;
  }, [filters, appliances]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchLogs();
    setRefreshing(false);
  }, [refetchLogs]);

  const styles = useMemo(() => createStyles(p, rf, isTablet), [p, rf, isTablet]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.gold} colors={[p.gold]} />
        }
      >
        <ThemedView style={styles.container}>
          {/* Restructured Header to exactly match Appliances Screen layout */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
              Analytics
            </ThemedText>
            {!genDisabled && (
              <Button
                title="Generate Data"
                size="sm"
                onPress={() => profile && generateLogs(profile.id)}
                loading={genLoading}
              />
            )}
          </View>
          <ThemedText style={styles.headerSubtitle} maxFontSizeMultiplier={1.2}>
            {periodConfig.label}
          </ThemedText>

          <View style={styles.tabBar}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as Granularity[]).map(g => (
              <Pressable
                key={g}
                style={[styles.tab, granularity === g && styles.tabActive]}
                onPress={() => setGranularity(g)}
              >
                <ThemedText style={[styles.tabText, granularity === g && styles.tabTextActive]} maxFontSizeMultiplier={1.2}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.filterBar}
            onPress={() => setFiltersExpanded(v => !v)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Ionicons name="options-outline" size={rf(18)} color={p.navy} />
              <ThemedText style={{ fontWeight: '600', color: p.navy, fontSize: rf(14) }} maxFontSizeMultiplier={1.2}>
                Filters
              </ThemedText>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <ThemedText style={{ color: 'white', fontSize: rf(11), fontWeight: '700' }} maxFontSizeMultiplier={1.2}>
                    {activeFilterCount}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              {filterSummary.length > 0 && (
                <ThemedText style={{ color: p.textMuted, fontSize: rf(12) }} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {filterSummary.join(' \u00B7 ')}
                </ThemedText>
              )}
              <Ionicons
                name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
                size={rf(18)}
                color={p.textMuted}
              />
            </View>
          </Pressable>

          {filtersExpanded && (
            <ThemedView style={styles.filterPanel}>
              <ThemedText style={styles.filterLabel}>Appliances</ThemedText>
              <View style={styles.chipRow}>
                {appliances.map((a: any) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    active={filters.applianceIds.includes(a.id)}
                    onPress={() => toggleAppliance(a.id)}
                    p={p}
                    styles={styles}
                  />
                ))}
                {appliances.length === 0 && (
                  <ThemedText style={{ color: p.textMuted, fontSize: rf(12) }}>No appliances found</ThemedText>
                )}
              </View>

              {categories.length > 0 && (
                <>
                  <ThemedText style={styles.filterLabel}>Categories</ThemedText>
                  <View style={styles.chipRow}>
                    {categories.map(cat => (
                      <Chip
                        key={cat}
                        label={cat}
                        active={filters.categories.includes(cat)}
                        onPress={() => toggleCategory(cat)}
                        p={p}
                        styles={styles}
                      />
                    ))}
                  </View>
                </>
              )}

              <ThemedText style={styles.filterLabel}>Display Metric</ThemedText>
              <View style={styles.metricRow}>
                <Pressable
                  style={[styles.metricOption, filters.metric === 'kWh' && styles.metricOptionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, metric: 'kWh' }))}
                >
                  <ThemedText style={[styles.metricText, filters.metric === 'kWh' && styles.metricTextActive]} maxFontSizeMultiplier={1.2}>
                    kWh (Energy)
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.metricOption, filters.metric === 'cost' && styles.metricOptionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, metric: 'cost' }))}
                >
                  <ThemedText style={[styles.metricText, filters.metric === 'cost' && styles.metricTextActive]} maxFontSizeMultiplier={1.2}>
                    ₱ (Cost)
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.toggleRow}>
                <ThemedText style={styles.filterLabel}>Period Comparison</ThemedText>
                <Pressable
                  style={[styles.toggleSwitch, filters.comparisonEnabled && styles.toggleSwitchOn]}
                  onPress={() => setFilters(prev => ({ ...prev, comparisonEnabled: !prev.comparisonEnabled }))}
                >
                  <View style={[styles.toggleThumb, filters.comparisonEnabled && styles.toggleThumbOn]} />
                </Pressable>
              </View>

              <View style={{ gap: Spacing.two }}>
                <ThemedText style={styles.filterLabel}>
                  Date Range {filters.dateRangeMode === 'custom' ? '(Custom)' : '(Preset)'}
                </ThemedText>
                <View style={styles.chipRow}>
                  <Chip
                    label="Preset"
                    active={filters.dateRangeMode === 'custom'}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      dateRangeMode: prev.dateRangeMode === 'custom' ? 'preset' : 'custom',
                    }))}
                    p={p}
                    styles={styles}
                  />
                </View>
                {filters.dateRangeMode === 'custom' && (
                  <View style={styles.dateInputRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: rf(11), color: p.textMuted, marginBottom: 4 }} maxFontSizeMultiplier={1.2}>From</ThemedText>
                      <TextInput
                        style={styles.dateInput}
                        value={filters.customFrom}
                        onChangeText={v => setFilters(prev => ({ ...prev, customFrom: v }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={p.textMuted}
                      />
                    </View>
                    <ThemedText style={{ marginTop: 16, color: p.textMuted }}>—</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: rf(11), color: p.textMuted, marginBottom: 4 }} maxFontSizeMultiplier={1.2}>To</ThemedText>
                      <TextInput
                        style={styles.dateInput}
                        value={filters.customTo}
                        onChangeText={(v) => setFilters(prev => ({ ...prev, customTo: v }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={p.textMuted}
                      />
                    </View>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two }}>
                <Button title="Clear All" size="sm" variant="outline" onPress={clearAllFilters} />
                <Button title="Apply" size="sm" onPress={() => setFiltersExpanded(false)} />
              </View>
            </ThemedView>
          )}

          {isLoading ? (
            <View style={{ padding: Spacing.eight }}>
              <Spinner />
            </View>
          ) : !hasData ? (
            <ThemedView style={styles.empty}>
              <Ionicons name="analytics-outline" size={rf(48)} color={p.textMuted} />
              <ThemedText style={{ fontWeight: 'bold', fontSize: rf(16) }} maxFontSizeMultiplier={1.2}>No Historical Data Yet</ThemedText>
              <ThemedText style={{ color: p.textMuted, textAlign: 'center', fontSize: rf(14) }} maxFontSizeMultiplier={1.2}>
                {genDisabled
                  ? 'No real usage data found. Connect your appliances to track your energy consumption.'
                  : 'Add appliances and generate demo data to see your energy trends over time.'}
              </ThemedText>
              {!genDisabled && (
                <Button
                  title="Generate Demo Data"
                  onPress={() => profile && generateLogs(profile.id)}
                  loading={genLoading}
                />
              )}
            </ThemedView>
          ) : (
            <>
              {summary && (
                <View style={styles.summaryRow}>
                  <SummaryCard
                    label="Total Consumption"
                    value={summary.totalKWh.toFixed(1)}
                    unit="kWh"
                    color={colors[0]}
                    p={p}
                    rf={rf}
                    styles={styles}
                  />
                  <SummaryCard
                    label="Total Cost"
                    value={`₱${summary.totalCost.toFixed(0)}`}
                    unit="for this period"
                    color={colors[4]}
                    p={p}
                    rf={rf}
                    styles={styles}
                  />
                  <SummaryCard
                    label={filters.metric === 'kWh' ? 'Daily Avg (kWh)' : 'Daily Avg (₱)'}
                    value={filters.metric === 'kWh'
                      ? summary.avgDaily.toFixed(2)
                      : `₱${summary.avgDaily.toFixed(0)}`}
                    unit="per day"
                    color={colors[2]}
                    p={p}
                    rf={rf}
                    styles={styles}
                  />
                  <SummaryCard
                    label="Peak Day"
                    value={summary.peakDay.label}
                    unit={
                      filters.metric === 'kWh'
                        ? `${summary.peakDay.kWh.toFixed(1)} kWh`
                        : `₱${summary.peakDay.cost.toFixed(0)}`
                    }
                    color={colors[3]}
                    p={p}
                    rf={rf}
                    styles={styles}
                  />
                </View>
              )}

              {comparison && (
                <ThemedView style={styles.comparisonBanner}>
                  <Ionicons
                    name={comparison.changePct > 0 ? 'trending-up' : 'trending-down'}
                    size={rf(18)}
                    color={comparison.changePct > 0 ? '#DC2626' : '#059669'}
                  />
                  <ThemedText style={{ fontWeight: '600', fontSize: rf(14) }} maxFontSizeMultiplier={1.2}>
                    {comparison.changePct > 0 ? 'Up ' : 'Down '}
                    {Math.abs(comparison.changePct).toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={{ color: p.textMuted, fontSize: rf(13) }} maxFontSizeMultiplier={1.2}>
                    vs previous period
                  </ThemedText>
                </ThemedView>
              )}

              {aggregated && aggregated.length > 0 && (
                <View style={styles.chartContainer}>
                  <ThemedText style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
                    Energy Consumption &amp; Cost
                  </ThemedText>
                  <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
                    <DualAxisChart data={aggregated} width={chartWidth} height={220} metric={filters.metric} p={p} rf={rf} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: Spacing.two }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, backgroundColor: p.gold, borderRadius: 2, opacity: 0.85 }} />
                      <ThemedText style={{ fontSize: rf(11) }} maxFontSizeMultiplier={1.2}>
                        {filters.metric === 'kWh' ? 'kWh' : 'Cost (₱)'}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, backgroundColor: p.navy, borderRadius: 5 }} />
                      <ThemedText style={{ fontSize: rf(11) }} maxFontSizeMultiplier={1.2}>
                        {filters.metric === 'kWh' ? 'Cost (₱)' : 'kWh'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {breakdown.length > 0 && (
                <View style={styles.chartContainer}>
                  <ThemedText style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Consumption Breakdown</ThemedText>
                  <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
                    <SimplePieChart data={pieData} p={p} rf={rf} />
                  </View>
                </View>
              )}

              {breakdown.length > 0 && (
                <View style={styles.sectionContainer}>
                  <ThemedText style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Top Consumers</ThemedText>
                  {breakdown.map((item, index) => (
                    <View key={index} style={styles.consumerCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 }}>
                        <View style={[styles.rankDot, { backgroundColor: colors[index % colors.length] }]} />
                        <View style={{ flexShrink: 1 }}>
                          <ThemedText style={{ fontWeight: 'bold', fontSize: rf(14) }} numberOfLines={1} maxFontSizeMultiplier={1.2}>{item.name}</ThemedText>
                          <ThemedText style={{ fontSize: rf(12), color: p.textMuted }} maxFontSizeMultiplier={1.2}>
                            {item.kWh.toFixed(1)} kWh
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText style={{ fontWeight: 'bold', fontSize: rf(14) }} maxFontSizeMultiplier={1.2}>₱{item.cost.toFixed(2)}</ThemedText>
                        <ThemedText style={{ fontSize: rf(12), color: p.gold }} maxFontSizeMultiplier={1.2}>
                          {item.percentage.toFixed(0)}% of total
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (p: Palette, rf: (n: number) => number, isTablet: boolean) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: isTablet ? 800 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  // Exactly mirrors the AppliancesScreen header alignment
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.one,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: rf(24),
    flexShrink: 1,
  },
  headerSubtitle: {
    color: p.textMuted,
    fontSize: rf(13),
    paddingBottom: Spacing.two,
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
    fontSize: rf(12),
    fontWeight: '600',
    color: p.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    gap: Spacing.two,
  },
  filterBadge: {
    backgroundColor: p.navy,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: p.divider,
  },
  chipActive: {
    backgroundColor: p.navy,
  },
  chipText: {
    fontSize: rf(12),
    color: p.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  filterLabel: {
    fontSize: rf(13),
    fontWeight: '600',
    color: p.text,
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  metricOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.divider,
  },
  metricOptionActive: {
    backgroundColor: p.gold,
    borderColor: p.gold,
  },
  metricText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: p.text,
  },
  metricTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: p.divider,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: p.navy,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: p.card ?? '#FFFFFF',
    elevation: 1,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: p.divider,
    borderRadius: 8,
    padding: 10,
    fontSize: rf(13),
    color: p.text,
    backgroundColor: p.bg,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.eight,
    paddingHorizontal: Spacing.four,
    backgroundColor: 'transparent',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    gap: 2,
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: p.divider,
    borderTopColor: p.divider,
    borderBottomColor: p.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  comparisonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartContainer: {
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionContainer: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: rf(17),
    fontWeight: 'bold',
  },
  consumerCard: {
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterPanel: {
    backgroundColor: p.card ?? p.bg,
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: p.divider,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});