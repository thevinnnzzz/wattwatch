// src/hooks/useBudgetNotifier.ts
import { useEffect } from 'react';
import { useBudgetAlert } from './useSupabaseQuery';
import { useAuth } from './useAuth';
import * as Notifications from 'expo-notifications';

/**
 * This hook is a self-contained, isolated listener for budget alerts.
 * It should be used by a single, persistent component mounted at the
 * root of the logged-in app layout.
 *
 * It calls the `useBudgetAlert` query and, upon success, sends a
 * local notification when the budget threshold is crossed.
 */
export function useBudgetNotifier() {
  const { profile } = useAuth();
  // This query runs the check on the backend.
  const { data: budgetAlertData } = useBudgetAlert(profile?.id ?? '');

  useEffect(() => {
    // This effect runs on the client when the data from the query changes.
    if (budgetAlertData && (budgetAlertData.type === 'approaching' || budgetAlertData.type === 'exceeded')) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: budgetAlertData.type === 'approaching' ? 'Budget Alert' : 'Budget Exceeded!',
          body: budgetAlertData.message,
          data: { type: `budget_${budgetAlertData.type}`, url: '/notifications' },
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    }
  }, [budgetAlertData]); // This effect re-runs only when budgetAlertData changes.
}