// budgetService.ts - Manage user budgets and alert checking
import { queryClient, queryKeys } from '@/lib/query-client';
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
  checkBudgetAlerts: async (userId: string): Promise<BudgetAlert | null> => {
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

    const { data: logs, error: logsErr } = await supabase
      .from('energy_logs')
      .select('cost_per_day')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (logsErr) return null;

    const spent = (logs ?? []).reduce((sum, l) => sum + (l.cost_per_day || 0), 0);
    const limit = budget.monthly_limit;
    const thresholdPct = budget.alert_threshold_pct;
    const spentPct = limit > 0 ? (spent / limit) * 100 : 0;

    // 3. Determine alert level
    let alert: BudgetAlert;
    let notifType: string;
    let title: string;

    if (spentPct >= 100) {
      notifType = 'budget_exceeded';
      title = 'Budget Exceeded!';
      alert = {
        type: 'exceeded',
        spent: spent,
        limit: limit,
        spentPct,
        thresholdPct,
        message: `You've exceeded your monthly budget of ₱${limit.toLocaleString()}! Total spending: ₱${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      };
    } else if (spentPct >= thresholdPct) {
      notifType = 'budget_approaching';
      title = 'Budget Alert';
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

    // 4. Delete any old unread alerts of this type for this user
    //    (so we only keep the latest one)
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', notifType)
      .eq('is_read', false);

    // 5. Always insert a fresh notification with latest budget data
    const { error: insertNotifErr } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message: alert.message,
      type: notifType,
      is_read: false,
    });

    // 6. Let the Notifications screen and unread badge know new data exists.
    //    Without this, both stay on their cached (stale) results — up to
    //    5 minutes for the list, until its next poll for the badge — even
    //    though the notification already exists in the database.
    if (!insertNotifErr) {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
    }

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