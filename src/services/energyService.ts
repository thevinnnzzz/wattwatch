// energyService.ts - Manage energy logs and calculations
import { supabase } from '@/lib/supabase';
import type { Appliance } from '@/types/database';
import { calcKwh, calcCost } from '@/lib/energyCalculations';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Generates and inserts a daily energy log for a single appliance.
 * Uses realistic random variation for consumption.
 * Deletes any existing entry for the same (appliance, date) first
 * to avoid duplicates without requiring a composite unique constraint.
 */
const generateAndLogForAppliance = async (
  appliance: Appliance,
  date: Date,
  rate: number
) => {
  // Weekend adjustment: less usage on weekends
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const variation = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
  const hoursMultiplier = isWeekend ? variation * 0.7 : variation;

  const hoursUsed = Math.max(0.5, appliance.hours_used_daily * hoursMultiplier);
  const kwh = parseFloat(calcKwh(appliance.wattage, hoursUsed).toFixed(2));
  const cost = parseFloat(calcCost(kwh, rate).toFixed(2));
  const dateStr = format(date, 'yyyy-MM-dd');

  // Delete any existing log for this appliance+date, then insert
  await supabase
    .from('energy_logs')
    .delete()
    .eq('user_id', appliance.user_id)
    .eq('appliance_id', appliance.id)
    .eq('date', dateStr);

  const { error } = await supabase.from('energy_logs').insert({
    user_id: appliance.user_id,
    appliance_id: appliance.id,
    date: dateStr,
    kwh_consumed: kwh,
    cost_per_day: cost,
    is_demo: true,
  });

  if (error) throw error;
};

export const energyService = {
  // Get energy logs for a user within a date range (with appliance join)
  getEnergyLogs: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('energy_logs')
      .select(`*, appliance:appliances(id, name, category)`)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },

  // Get aggregated energy stats for the dashboard (current month)
  getDashboardStats: async (userId: string, excludeDemo = false) => {
    const now = new Date();
    const from = format(startOfMonth(now), 'yyyy-MM-dd');
    const to = format(endOfMonth(now), 'yyyy-MM-dd');

    let query = supabase
      .from('energy_logs')
      .select(`kwh_consumed, cost_per_day, appliance:appliances(id, name)`)
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to);

    if (excludeDemo) {
      query = query.eq('is_demo', false);
    }

    const { data: logs, error } = await query;

    if (error) return { data: null, error };

    const totalKwh = logs.reduce((sum, log) => sum + log.kwh_consumed, 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost_per_day || 0), 0);

    const consumerMap = new Map<string, { name: string; kwh: number; cost: number }>();
    logs.forEach(log => {
      const app = Array.isArray(log.appliance) ? log.appliance[0] : log.appliance;
      if (app) {
        const existing = consumerMap.get(app.id);
        if (existing) {
          existing.kwh += log.kwh_consumed;
          existing.cost += (log.cost_per_day || 0);
        } else {
          consumerMap.set(app.id, {
            name: app.name,
            kwh: log.kwh_consumed,
            cost: log.cost_per_day || 0,
          });
        }
      }
    });

    const topConsumers = Array.from(consumerMap.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(consumer => ({
        ...consumer,
        percentageOfTotal: totalCost > 0 ? (consumer.cost / totalCost) * 100 : 0,
      }));

    return {
      data: { totalKwh, totalCost, topConsumers },
      error: null,
    };
  },

  /**
   * Generates historical logs for a newly created or updated appliance.
   * This fills in the last 30 days of data for the charts.
   */
  generateLogsForAppliance: async (appliance: Appliance, rate: number) => {
    const today = new Date();
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      promises.push(generateAndLogForAppliance(appliance, date, rate));
    }
    await Promise.all(promises);
    return { data: { success: true }, error: null };
  },

  /**
   * Generates 30 days of mock energy log data for ALL of the user's active appliances.
   */
  generateDailyEnergyLogs: async (userId: string) => {
    const { data: appliances, error: appError } = await supabase
      .from('appliances')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (appError || !appliances?.length) {
      return { data: null, error: appError ?? new Error('No active appliances found') };
    }

    const { data: rateData } = await supabase.from('rate_plans').select('rate_per_kwh').eq('is_active', true).single();
    const rate = rateData?.rate_per_kwh ?? 12.45;

    const promises: Promise<any>[] = [];
    for (const appliance of appliances) {
      promises.push(energyService.generateLogsForAppliance(appliance, rate));
    }

    await Promise.all(promises.flat());
    return { data: { success: true }, error: null };
  },
};

export default energyService;