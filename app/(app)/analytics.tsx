import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import Svg, { Rect, Text as SvgText, G, Path, Line, Circle } from 'react-native-svg';
import { useAuth } from '@/hooks/useAuth';
import { useEnergyLogs, useUserAppliances, useActiveRate, useGenerateEnergyLogs } from '@/hooks/useSupabaseQuery';
import { subDays, format } from 'date-fns';
import { aggregateEnergyLogs, buildApplianceBreakdown, type Granularity, type AggregatedPoint } from '@/lib/energyCalculations';
import Spinner from '@/components/ui/Loading';
import { LP } from '@/constants/loginPalette';
import { Ionicons } from '@expo/vector-icons';

// ─── Color palette consistent with app theme ────────────────────────────
const CHART_COLORS = [LP.gold, LP.navy, '#FBBF24', '#DC2626', '#7C3AED', '#059669', '#DB2777', '#2563EB'];

type MetricMode = 'kWh' | 'cost';
type DateRangeMode = 'preset' | 'custom';

interface ActiveFilters {
  applianceIds: string[];          // empty = all
  categories: string[];            // empty = all
  metric: MetricMode;
  comparisonEnabled: boolean;
  dateRangeMode: DateRangeMode;
  customFrom: string;
  customTo: string;
}

// Gather unique categories from appliances
const gatherCategories = (appliances: any[]): string[] => {
  const cats = new Set<string>();
  for (const a of appliances) {
    if (a.category) cats.add(a.category);
  }
  return Array.from(cats).sort();
};

// ─── Granularity → display config ──────────────────────────────────────────

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

// ─── Dual-axis chart (kWh bars + Cost line) ─────────────────────────────────

const DualAxisChart = ({
  data,
  width = 320,
  height = 220,
  metric,
}: {
  data: AggregatedPoint[];
  width?: number;
  height?: number;
  metric: MetricMode;
}) => {
  if (!data.length) {
    return <ThemedText style={{ textAlign: 'center', padding: 20, color: LP.textMuted }}>No data available</ThemedText>;
  }

  const maxPrimary = Math.max(...data.map(d => (metric === 'kWh' ? d.kWh : d.cost)), 1);

  const padding = { top: 10, bottom: 30, left: 48, right: 15 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = Math.max(2, chartW / data.length - 8);

  const primaryLabel = metric === 'kWh' ? 'kWh' : '₱';

  return (
    <Svg width={width} height={height}>
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = padding.top + chartH * (1 - pct);
        return (
          <SvgText key={pct} x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={8} fill={LP.textMuted}>
            {metric === 'kWh' ? (maxPrimary * pct).toFixed(1) : `₱${(maxPrimary * pct).toFixed(0)}`}
          </SvgText>
        );
      })}

      {/* Bars */}
      {data.map((pt, idx) => {
        const val = metric === 'kWh' ? pt.kWh : pt.cost;
        const barH = maxPrimary > 0 ? (val / maxPrimary) * chartH : 0;
        const x = padding.left + idx * (chartW / data.length) + 4;
        const y = padding.top + chartH - barH;
        return (
          <Rect key={`bar-${idx}`} x={x} y={y} width={barW} height={barH || 1} fill={LP.gold} rx={2} opacity={0.85} />
        );
      })}

      {/* Secondary line (cost when kWh mode, kWh when cost mode) */}
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
            <Line x1={prevX} y1={prevY} x2={currX} y2={currY} stroke={LP.navy} strokeWidth={2} />
            <Circle cx={currX} cy={currY} r={3} fill={LP.navy} />
          </G>
        );
      })}

      {/* X-axis labels */}
      {data.filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 7) === 0).map((item, idx) => {
        const realIdx = data.findIndex(d => d.key === item.key);
        const x = padding.left + realIdx * (chartW / data.length) + 4 + barW / 2;
        return (
          <SvgText key={`x-${idx}`} x={x} y={height - 6} textAnchor="middle" fontSize={9} fill={LP.textMuted}>
            {item.label}
          </SvgText>
        );
      })}
    </Svg>
  );
};

// ─── Pie Chart ───────────────────────────────────────────────────────────────

const SimplePieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  if (!data.length) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return <ThemedText style={{ textAlign: 'center', padding: 20, color: LP.textMuted }}>No consumption data</ThemedText>;

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
                <SvgText x={labelX} y={labelY + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
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
            <ThemedText style={{ fontSize: 11 }} numberOfLines={1}>{item.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Summary Card ────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <View style={[styles.summaryCard, { borderLeftColor: color }]}>
    <ThemedText style={{ color: LP.textMuted, fontSize: 11 }}>{label}</ThemedText>
    <ThemedText style={{ fontWeight: 'bold', fontSize: 18, color }}>{value}</ThemedText>
    <ThemedText style={{ color: LP.textMuted, fontSize: 10 }}>{unit}</ThemedText>
  </View>
);

// ─── Chip / Tag ──────────────────────────────────────────────────────────────

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <ThemedText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {label}
    </ThemedText>
    {active && <Ionicons name="close" size={14} color="white" />}
  </Pressable>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { profile } = useAuth();
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const { data: appliancesData } = useUserAppliances(profile?.id ?? '');
  const { data: rateData } = useActiveRate();
  const { mutate: generateLogs, isPending: genLoading } = useGenerateEnergyLogs();

  const appliances = (appliancesData as any)?.data ?? [];
  const rate = (rateData as any)?.data?.rate_per_kwh ?? 12.45;

  // ─── Filter State ──────────────────────────────────────────────────────
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

  // Toggle helpers
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

  // ─── Date Range ────────────────────────────────────────────────────────
  const periodConfig = getPeriodConfig(
    granularity,
    filters.dateRangeMode === 'custom' ? filters.customFrom : undefined,
    filters.dateRangeMode === 'custom' ? filters.customTo : undefined,
  );
  const fromStr = format(periodConfig.from, 'yyyy-MM-dd');
  const toStr = format(periodConfig.to, 'yyyy-MM-dd');

  // ─── Data Fetching ─────────────────────────────────────────────────────
  const { data: logsData, isLoading } = useEnergyLogs(profile?.id ?? '', fromStr, toStr);
  const rawLogs = (logsData as any)?.data ?? [];

  // ─── Apply filters to logs ─────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let logs = rawLogs;

    // Filter by selected appliances
    if (filters.applianceIds.length > 0) {
      logs = logs.filter((l: any) => filters.applianceIds.includes(l.appliance_id ?? l.appliance?.id));
    }

    // Filter by selected categories
    if (filters.categories.length > 0) {
      logs = logs.filter((l: any) => {
        const cat = l.appliance?.category;
        return cat && filters.categories.includes(cat);
      });
    }

    return logs;
  }, [rawLogs, filters.applianceIds, filters.categories]);

  // ─── Aggregation ───────────────────────────────────────────────────────
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

  const pieData = useMemo(() =>
    breakdown.map((b, i) => ({ label: b.name, value: b.cost, color: CHART_COLORS[i % CHART_COLORS.length] })),
    [breakdown]
  );

  const hasData = filteredLogs.length > 0;

  // ── Filtered-in appliance names for the UI badge ──
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

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LP.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={{ fontSize: 28 }}>Analytics</ThemedText>
              <ThemedText style={{ color: LP.textMuted }}>{periodConfig.label}</ThemedText>
            </View>
            <Button
              title="Generate Demo Data"
              size="sm"
              onPress={() => profile && generateLogs(profile.id)}
              loading={genLoading}
              style={{ height: 32 }}
            />
          </View>

          {/* Granularity Tabs */}
          <View style={styles.tabBar}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as Granularity[]).map(g => (
              <Pressable
                key={g}
                style={[styles.tab, granularity === g && styles.tabActive]}
                onPress={() => setGranularity(g)}
              >
                <ThemedText style={[styles.tabText, granularity === g && styles.tabTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* ─────── Filter Bar ─────────────────────────────────────────── */}
          <Pressable
            style={styles.filterBar}
            onPress={() => setFiltersExpanded(v => !v)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Ionicons name="options-outline" size={18} color={LP.navy} />
              <ThemedText style={{ fontWeight: '600', color: LP.navy }}>
                Filters
              </ThemedText>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <ThemedText style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                    {activeFilterCount}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              {filterSummary.length > 0 && (
                <ThemedText style={{ color: LP.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {filterSummary.join(' · ')}
                </ThemedText>
              )}
              <Ionicons
                name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={LP.textMuted}
              />
            </View>
          </Pressable>

          {/* ─────── Expanded Filter Panel ──────────────────────────────── */}
          {filtersExpanded && (
            <ThemedView style={styles.filterPanel}>
              {/* ── Appliances ────────────────────────────────────────── */}
              <ThemedText style={styles.filterLabel}>Appliances</ThemedText>
              <View style={styles.chipRow}>
                {appliances.map((a: any) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    active={filters.applianceIds.includes(a.id)}
                    onPress={() => toggleAppliance(a.id)}
                  />
                ))}
                {appliances.length === 0 && (
                  <ThemedText style={{ color: LP.textMuted, fontSize: 12 }}>No appliances found</ThemedText>
                )}
              </View>

              {/* ── Categories ─────────────────────────────────────────── */}
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
                      />
                    ))}
                  </View>
                </>
              )}

              {/* ── Display Metric ─────────────────────────────────────── */}
              <ThemedText style={styles.filterLabel}>Display Metric</ThemedText>
              <View style={styles.metricRow}>
                <Pressable
                  style={[styles.metricOption, filters.metric === 'kWh' && styles.metricOptionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, metric: 'kWh' }))}
                >
                  <ThemedText style={[styles.metricText, filters.metric === 'kWh' && styles.metricTextActive]}>
                    kWh (Energy)
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.metricOption, filters.metric === 'cost' && styles.metricOptionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, metric: 'cost' }))}
                >
                  <ThemedText style={[styles.metricText, filters.metric === 'cost' && styles.metricTextActive]}>
                    ₱ (Cost)
                  </ThemedText>
                </Pressable>
              </View>

              {/* ── Comparison Toggle ──────────────────────────────────── */}
              <View style={styles.toggleRow}>
                <ThemedText style={styles.filterLabel}>Period Comparison</ThemedText>
                <Pressable
                  style={[styles.toggleSwitch, filters.comparisonEnabled && styles.toggleSwitchOn]}
                  onPress={() => setFilters(prev => ({ ...prev, comparisonEnabled: !prev.comparisonEnabled }))}
                >
                  <View style={[styles.toggleThumb, filters.comparisonEnabled && styles.toggleThumbOn]} />
                </Pressable>
              </View>

              {/* ── Custom Date Range ──────────────────────────────────── */}
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
                  />
                </View>
                {filters.dateRangeMode === 'custom' && (
                  <View style={styles.dateInputRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 11, color: LP.textMuted, marginBottom: 4 }}>From</ThemedText>
                      <TextInput
                        style={styles.dateInput}
                        value={filters.customFrom}
                        onChangeText={v => setFilters(prev => ({ ...prev, customFrom: v }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={LP.textMuted}
                      />
                    </View>
                    <ThemedText style={{ marginTop: 16, color: LP.textMuted }}>—</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 11, color: LP.textMuted, marginBottom: 4 }}>To</ThemedText>
                      <TextInput
                        style={styles.dateInput}
                        value={filters.customTo}
                        onChangeText={(v) => setFilters(prev => ({ ...prev, customTo: v }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={LP.textMuted}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* ── Clear Filters ──────────────────────────────────────── */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two }}>
                <Button title="Clear All Filters" size="sm" variant="outline" onPress={clearAllFilters} />
                <Button title="Apply" size="sm" onPress={() => setFiltersExpanded(false)} />
              </View>
            </ThemedView>
          )}

          {/* ─────── Content ───────────────────────────────────────────── */}
          {isLoading ? (
            <View style={{ padding: Spacing.eight }}>
              <Spinner />
            </View>
          ) : !hasData ? (
            <ThemedView style={styles.empty}>
              <Ionicons name="analytics-outline" size={48} color={LP.textMuted} />
              <ThemedText style={{ fontWeight: 'bold', fontSize: 16 }}>No Historical Data Yet</ThemedText>
              <ThemedText style={{ color: LP.textMuted, textAlign: 'center' }}>
                Add appliances and generate demo data to see your energy trends over time.
              </ThemedText>
              <Button
                title="Generate Demo Data"
                onPress={() => profile && generateLogs(profile.id)}
                loading={genLoading}
              />
            </ThemedView>
          ) : (
            <>
              {/* ─── Summary Cards ─────────────────────────────────────── */}
              {summary && (
                <View style={styles.summaryRow}>
                  <SummaryCard
                    label="Total Consumption"
                    value={summary.totalKWh.toFixed(1)}
                    unit="kWh"
                    color={CHART_COLORS[0]}
                  />
                  <SummaryCard
                    label="Total Cost"
                    value={`₱${summary.totalCost.toFixed(0)}`}
                    unit="for this period"
                    color={CHART_COLORS[4]}
                  />
                  <SummaryCard
                    label={filters.metric === 'kWh' ? 'Daily Avg (kWh)' : 'Daily Avg (₱)'}
                    value={filters.metric === 'kWh'
                      ? summary.avgDaily.toFixed(2)
                      : `₱${summary.avgDaily.toFixed(0)}`}
                    unit="per day"
                    color={CHART_COLORS[2]}
                  />
                  <SummaryCard
                    label="Peak Day"
                    value={summary.peakDay.label}
                    unit={
                      filters.metric === 'kWh'
                        ? `${summary.peakDay.kWh.toFixed(1)} kWh`
                        : `₱${summary.peakDay.cost.toFixed(0)}`
                    }
                    color={CHART_COLORS[3]}
                  />
                </View>
              )}

              {/* ─── Period Comparison Banner ──────────────────────────── */}
              {comparison && (
                <ThemedView style={styles.comparisonBanner}>
                  <Ionicons
                    name={comparison.changePct > 0 ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={comparison.changePct > 0 ? '#DC2626' : '#059669'}
                  />
                  <ThemedText style={{ fontWeight: '600' }}>
                    {comparison.changePct > 0 ? 'Up ' : 'Down '}
                    {Math.abs(comparison.changePct).toFixed(1)}%
                  </ThemedText>
                  <ThemedText style={{ color: LP.textMuted, fontSize: 13 }}>
                    vs previous period
                  </ThemedText>
                </ThemedView>
              )}

              {/* ─── Dual-Axis Chart ──────────────────────────────────── */}
              {aggregated && aggregated.length > 0 && (
                <View style={styles.chartContainer}>
                  <ThemedText style={styles.sectionTitle}>
                    Energy Consumption &amp; Cost
                  </ThemedText>
                  <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
                    <DualAxisChart data={aggregated} width={320} height={220} metric={filters.metric} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, backgroundColor: LP.gold, borderRadius: 2, opacity: 0.85 }} />
                      <ThemedText style={{ fontSize: 11 }}>
                        {filters.metric === 'kWh' ? 'kWh' : 'Cost (₱)'}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, backgroundColor: LP.navy, borderRadius: 5 }} />
                      <ThemedText style={{ fontSize: 11 }}>
                        {filters.metric === 'kWh' ? 'Cost (₱)' : 'kWh'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {/* ─── Breakdown Pie Chart ───────────────────────────────── */}
              {breakdown.length > 0 && (
                <View style={styles.chartContainer}>
                  <ThemedText style={styles.sectionTitle}>Consumption Breakdown</ThemedText>
                  <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
                    <SimplePieChart data={pieData} />
                  </View>
                </View>
              )}

              {/* ─── Appliance Ranking Table ────────────────────────────── */}
              {breakdown.length > 0 && (
                <View style={styles.sectionContainer}>
                  <ThemedText style={styles.sectionTitle}>Top Consumers</ThemedText>
                  {breakdown.map((item, index) => (
                    <View key={index} style={styles.consumerCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                        <View style={[styles.rankDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                        <View>
                          <ThemedText style={{ fontWeight: 'bold' }}>{item.name}</ThemedText>
                          <ThemedText style={{ fontSize: 12, color: LP.textMuted }}>
                            {item.kWh.toFixed(1)} kWh
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText style={{ fontWeight: 'bold' }}>₱{item.cost.toFixed(2)}</ThemedText>
                        <ThemedText style={{ fontSize: 12, color: LP.gold }}>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: Spacing.two },

  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: LP.gold },
  tabText: { fontSize: 12, fontWeight: '600', color: LP.textMuted },
  tabTextActive: { color: 'white' },

  // ─── Filter styles ─────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.three,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    gap: Spacing.two,
  },
  filterBadge: {
    backgroundColor: LP.navy, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.two },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chipActive: {
    backgroundColor: LP.navy,
  },
  chipText: { fontSize: 12, color: LP.text },
  chipTextActive: { color: 'white' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: LP.text, marginBottom: 6 },
  metricRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  metricOption: {
    flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: LP.divider,
  },
  metricOptionActive: { backgroundColor: LP.gold, borderColor: LP.gold },
  metricText: { fontSize: 13, fontWeight: '600', color: LP.text },
  metricTextActive: { color: 'white' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  toggleSwitch: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: LP.divider, justifyContent: 'center', padding: 2,
  },
  toggleSwitchOn: { backgroundColor: LP.navy },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: 'white',
    elevation: 1,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  dateInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  dateInput: {
    borderWidth: 1, borderColor: LP.divider, borderRadius: 8, padding: 10,
    fontSize: 13, color: LP.text, backgroundColor: 'white',
    },

  // ─── Content ────────────────────────────────────────────────────
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.eight, paddingHorizontal: Spacing.four },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  summaryCard: {
    flex: 1, minWidth: 140, gap: 2,
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.three,
    borderLeftWidth: 3, borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)', borderTopColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.06)',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  comparisonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.three,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  chartContainer: {
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.four, gap: Spacing.two,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  sectionContainer: { gap: Spacing.three },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  consumerCard: {
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.three,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  rankDot: { width: 12, height: 12, borderRadius: 6 },
  filterPanel: {
    backgroundColor: 'white', borderRadius: 12, padding: Spacing.four, gap: Spacing.two,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
});