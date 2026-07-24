// Core energy calculation utilities for WattWatch
import type { Appliance, EnergyLog } from '@/types/database';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, format, parseISO } from 'date-fns';

/**
 * Calculates energy consumption in kilowatt-hours (kWh).
 */
export const calcKwh = (wattage: number, hoursUsed: number): number => {
  if (wattage < 0 || hoursUsed < 0) return 0;
  return (wattage * hoursUsed) / 1000;
};

/**
 * Calculates the estimated cost of energy consumption.
 */
export const calcCost = (kWh: number, rate: number): number => {
  if (kWh < 0 || rate < 0) return 0;
  return kWh * rate;
};

/**
 * Calculates the daily cost for a single appliance.
 */
export const calcDailyCost = (appliance: Appliance, rate: number): number => {
  const kwh = calcKwh(appliance.wattage, appliance.hours_used_daily);
  return calcCost(kwh, rate);
};

/**
 * Calculates the estimated monthly cost for a single appliance.
 */
export const calcMonthlyCost = (appliance: Appliance, rate: number): number => {
  return calcDailyCost(appliance, rate) * 30;
};

/**
 * Calculates the total daily cost for a list of appliances.
 */
export const calcTotalDailyCost = (appliances: Appliance[], rate: number): number => {
  return appliances
    .filter(a => a.is_active)
    .reduce((total, appliance) => total + calcDailyCost(appliance, rate), 0);
};

/**
 * Ranks appliances by their energy consumption.
 */
export const getTopConsumers = (
  appliances: Appliance[],
  rate: number,
  limit?: number
): Array<Appliance & { dailyCost: number; percentage: number }> => {
  const totalCost = calcTotalDailyCost(appliances, rate);
  const ranked = appliances
    .map(appliance => {
      const dailyCost = appliance.is_active ? calcDailyCost(appliance, rate) : 0;
      const percentage = totalCost > 0 ? (dailyCost / totalCost) * 100 : 0;
      return { ...appliance, dailyCost, percentage };
    })
    .sort((a, b) => b.dailyCost - a.dailyCost);

  return limit ? ranked.slice(0, limit) : ranked;
};

// ─── Aggregation utilities for historical analytics ──────────────────────

export type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AggregatedPoint {
  key: string;       // period label, e.g. "2026-07-22", "2026-W30", "2026-07", "2026"
  label: string;     // display label, e.g. "Jul 22", "Week 30", "Jul", "2026"
  kWh: number;
  cost: number;
  count: number;     // number of raw log rows in this bucket
  applianceBreakdown: Record<string, { kWh: number; cost: number }>;
}

interface IntervalFn {
  (interval: { start: Date; end: Date }, options?: any): Date[];
}

/**
 * Aggregates an array of energy logs into the requested granularity buckets.
 *
 * @param logs    - raw energy logs (may be unsorted)
 * @param from    - start of the display window
 * @param to      - end of the display window
 * @param rate    - per-kWh rate to use when the log has no stored cost
 * @param granularity
 */
export const aggregateEnergyLogs = (
  logs: (EnergyLog & { appliance?: { id: string; name: string } | null })[],
  from: Date,
  to: Date,
  rate: number,
  granularity: Granularity
): AggregatedPoint[] => {
  // Build empty buckets for every period in the range
  const periods: { start: Date; end: Date; key: string; label: string }[] = [];

  switch (granularity) {
    case 'daily': {
      const days = eachDayOfInterval({ start: from, end: to });
      for (const d of days) {
        periods.push({
          start: d,
          end: d,
          key: format(d, 'yyyy-MM-dd'),
          label: format(d, 'MMM dd'),
        });
      }
      break;
    }
    case 'weekly': {
      const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 0 });
      for (const w of weeks) {
        const end = new Date(w);
        end.setDate(end.getDate() + 6);
        periods.push({
          start: w,
          end: end > to ? to : end,
          key: format(w, "yyyy-'W'ww"),
          label: format(w, 'MMM dd'),
        });
      }
      break;
    }
    case 'monthly': {
      const months = eachMonthOfInterval({ start: from, end: to });
      for (const m of months) {
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        periods.push({
          start: m,
          end: end > to ? to : end,
          key: format(m, 'yyyy-MM'),
          label: format(m, 'MMM yyyy'),
        });
      }
      break;
    }
    case 'yearly': {
      const years = eachYearOfInterval({ start: from, end: to });
      for (const y of years) {
        const end = new Date(y.getFullYear(), 11, 31);
        periods.push({
          start: y,
          end: end > to ? to : end,
          key: format(y, 'yyyy'),
          label: format(y, 'yyyy'),
        });
      }
      break;
    }
  }

  // Initialize buckets
  const buckets = new Map<string, AggregatedPoint>(
    periods.map(p => [p.key, {
      key: p.key,
      label: p.label,
      kWh: 0,
      cost: 0,
      count: 0,
      applianceBreakdown: {},
    }])
  );

  // Bucket each log
  for (const log of logs) {
    const logDate = typeof log.date === 'string' ? parseISO(log.date) : new Date(log.date as any);
    if (isNaN(logDate.getTime())) continue;

    let bucketKey: string | null = null;
    for (const p of periods) {
      if (logDate >= p.start && logDate <= p.end) {
        bucketKey = p.key;
        break;
      }
    }
    if (!bucketKey) continue;

    const bucket = buckets.get(bucketKey);
    if (!bucket) continue;

    const cost = calcCost(log.kwh_consumed, rate);
    bucket.kWh += log.kwh_consumed;
    bucket.cost += cost;
    bucket.count++;

    const applianceName = log.appliance?.name ?? 'Unknown';
    if (!bucket.applianceBreakdown[applianceName]) {
      bucket.applianceBreakdown[applianceName] = { kWh: 0, cost: 0 };
    }
    bucket.applianceBreakdown[applianceName].kWh += log.kwh_consumed;
    bucket.applianceBreakdown[applianceName].cost += cost;
  }

  // Return in chronological order
  return periods.map(p => buckets.get(p.key)!);
};

/**
 * Builds appliance-level breakdown from aggregated points (sums across all buckets).
 */
export const buildApplianceBreakdown = (
  points: AggregatedPoint[]
): Array<{ name: string; kWh: number; cost: number; percentage: number }> => {
  const map: Record<string, { kWh: number; cost: number }> = {};
  let totalCost = 0;

  for (const pt of points) {
    for (const [name, data] of Object.entries(pt.applianceBreakdown)) {
      if (!map[name]) map[name] = { kWh: 0, cost: 0 };
      map[name].kWh += data.kWh;
      map[name].cost += data.cost;
      totalCost += data.cost;
    }
  }

  return Object.entries(map)
    .map(([name, data]) => ({ name, ...data, percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0 }))
    .sort((a, b) => b.cost - a.cost);
};

/**
 * Generates contextual energy-saving tips based on usage.
 */
export const generateTips = (appliances: Appliance[], rate: number): string[] => {
  if (appliances.length === 0) return [];

  const tips: string[] = [];
  const topConsumers = getTopConsumers(appliances, rate, 3);

  if (topConsumers.length > 0) {
    const top = topConsumers[0];
    tips.push(
      `Your ${top.name} is your top energy consumer, accounting for ${top.percentage.toFixed(0)}% of your daily bill. Consider using it more efficiently.`
    );
  }

  const highUsageAppliances = appliances.filter(a => a.hours_used_daily > 12 && a.category !== 'Refrigerator');
  if (highUsageAppliances.length > 0) {
    tips.push(
      `Appliances like ${highUsageAppliances.map(a => a.name).join(', ')} are running for over 12 hours a day. Could you reduce their active time?`
    );
  }

  if (appliances.some(a => a.category === 'Air Conditioner')) {
    tips.push('For every degree you raise your AC, you can save up to 3% on your cooling costs.');
  }

  tips.push('Unplug devices when not in use. Even on standby, they consume "phantom" energy.');
  tips.push('Switch to LED bulbs. They use up to 75% less energy than incandescent bulbs.');

  return tips;
};

