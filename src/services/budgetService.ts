// budgetService.ts - Manage user budgets and alert checking
import { supabase } from '@/lib/supabase';
import type { BudgetUpdate } from '@/types/database';

export interface BudgetAlert {
  type: 'approaching' | 'exceeded' | 'ok';
  spent: number;
  limit: number;
  spentPct: number;
  thresholdPct: number;
  message: string;
}

export const budgetService = {
  // Get or create budget for the user (one budget per user)
  getOrCreateBudget: async (userId: string) => {
    let { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newBudget, error: insertError } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          monthly_limit: 5000,
          alert_threshold_pct: 80,
        })
        .select()
        .single();

      if (insertError) return { data: null, error: insertError };
      budget = newBudget;
    } else if (error) {
      return { data: null, error };
    }

    return { data: budget, error: null };
  },

  // Update a budget
  updateBudget: async (budgetId: string, updates: BudgetUpdate) => {
    const { data, error } = await supabase
      .from('budgets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Checks the current month's spending against the user's budget
   * and returns an alert result. Also creates a notification in the
   * database when the threshold is breached for the first time this month.
   */
  checkBudgetAlerts: async (userId: string, excludeDemo?: boolean): Promise<BudgetAlert | null> => {
    // 1. Get the user's budget
    const { data: budget, error: budgetErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (budgetErr || !budget) return null;

    // 2. Sum this month's energy costs using proper date range
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

    const [logsResult, rateResult] = await Promise.all([
      (() => {
        let q = supabase
          .from('energy_logs')
          .select('kwh_consumed')
          .eq('user_id', userId)
          .gte('date', monthStart)
          .lte('date', monthEnd);
        if (excludeDemo) q = q.eq('is_demo', false);
        return q;
      })(),
      supabase
        .from('rate_plans')
        .select('rate_per_kwh')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single(),
    ]);

    const logs = logsResult.data;
    const rate = rateResult.data?.rate_per_kwh ?? 12.45;

    if (logsResult.error || !logs) return null;

    const totalKwh = logs.reduce((sum, l) => sum + (l.kwh_consumed || 0), 0);
    const spent = totalKwh * rate;
    const limit = budget.monthly_limit;
    const thresholdPct = budget.alert_threshold_pct;
    const spentPct = limit > 0 ? (spent / limit) * 100 : 0;

    // 3. Determine alert level
    let alert: BudgetAlert;

    if (spentPct >= 100) {
      alert = {
        type: 'exceeded',
        spent: spent,
        limit: limit,
        spentPct,
        thresholdPct,
        message: `You've exceeded your monthly budget of ₱${limit.toLocaleString()}! Total spending: ₱${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      };
    } else if (spentPct >= thresholdPct) {
      alert = {
        type: 'approaching',
        spent: spent,
        limit: limit,
        spentPct,
        thresholdPct,
        message: `You're approaching your monthly budget limit. ${spentPct.toFixed(0)}% of ₱${limit.toLocaleString()} spent (₱${spent.toFixed(2)}).`,
      };
    } else {
      return { type: 'ok', spent: spent, limit: limit, spentPct, thresholdPct, message: '' };
    }

    // Notification creation is handled by the DashboardScreen useEffect
    // (guarded by shownAlertKey) so it only fires once per alert cycle,
    // not on every query execution.

    return alert;
  },

  /**
   * Fetch the user's notifications (for the notification screen).
   */
  getUserNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  },

  /**
   * Mark a notification as read.
   */
  markNotificationRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Count unread notifications for the badge.
   */
  countUnreadNotifications: async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { count, error };
  },
};

export default budgetService;