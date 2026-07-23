// Supabase query hooks wrapper for TanStack Query
import { queryClient, queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { adminService, applianceService, budgetService, energyService, rateService } from '@/services';
import type { BudgetAlert } from '@/services/budgetService';
import type { Appliance } from '@/types/database';
import { Platform } from 'react-native';
import { showAppAlert } from '@/components/ui/AppAlert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lazy-load expo-notifications (may not be available in Expo Go)
let ExpoNotifications: any = null;
try {
  ExpoNotifications = require('expo-notifications');
} catch {
  // expo-notifications not available — local push skipped silently
}

const sendLocalPush = async (title: string, body: string, data?: any) => {
  if (!ExpoNotifications || Platform.OS === 'web') return;
  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, icon: 'icon', sound: true, data },
      trigger: null,
    });
  } catch {
    // local push failed silently
  }
};

// Generic query hooks
export function useSupabaseQuery<T>(
  key: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery({
    queryKey: key,
    queryFn,
    ...options,
  });
}

export function useSupabaseMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: any }>,
  options?: {
    onSuccess?: (data: TData | null, variables: TVariables) => void;
    onError?: (error: any) => void;
    invalidateKeys?: readonly (readonly unknown[])[];
  }
) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const { data, error } = await mutationFn(variables);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => client.invalidateQueries({ queryKey: key }));
      }
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

// WattWatch Hooks
export function useProfile(userId: string) {
  return useSupabaseQuery(
    queryKeys.auth.profile(userId),
    async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },
    { enabled: !!userId }
  );
}

export function useUserAppliances(userId: string) {
  return useSupabaseQuery(
    queryKeys.appliances.all(userId),
    () => applianceService.getAppliances(userId),
    { enabled: !!userId }
  );
}

export function useAppliance(applianceId: string) {
  return useSupabaseQuery(
    queryKeys.appliances.detail(applianceId),
    () => applianceService.getAppliance(applianceId),
    { enabled: !!applianceId }
  );
}

export function useApplianceCatalog() {
  return useSupabaseQuery(
    queryKeys.appliances.catalog(),
    () => applianceService.getApplianceCatalog()
  );
}

export function useEnergyLogs(userId: string, startDate: string, endDate: string) {
  return useSupabaseQuery(
    queryKeys.energy.logs(userId, startDate, endDate),
    () => energyService.getEnergyLogs(userId, startDate, endDate),
    { enabled: !!userId && !!startDate && !!endDate }
  );
}

export function useDashboardStats(userId: string, excludeDemo = false) {
  return useSupabaseQuery(
    queryKeys.energy.dashboard(userId, excludeDemo),
    () => energyService.getDashboardStats(userId, excludeDemo),
    { enabled: !!userId }
  );
}

export function useBudget(userId: string) {
  return useSupabaseQuery(
    queryKeys.energy.budget(userId),
    () => budgetService.getOrCreateBudget(userId),
    { enabled: !!userId }
  );
}

export function useActiveRate() {
  return useSupabaseQuery(
    queryKeys.energy.rate(),
    () => rateService.getActiveRate()
  );
}

// Mutation hooks
export function useCreateAppliance() {
  const { data: rateData } = useActiveRate();
  const generateLogs = useGenerateLogsForAppliance();

  return useSupabaseMutation(
    applianceService.createAppliance,
    {
      onSuccess: (data) => {
        if (data) {
          const rate = rateData?.rate_per_kwh ?? 12.45;
          generateLogs.mutate({ appliance: data, rate });
          queryClient.invalidateQueries({ queryKey: queryKeys.appliances.all(data.user_id) });
        }
      },
    }
  );
}

export function useUpdateAppliance() {
  const { data: rateData } = useActiveRate();
  const generateLogs = useGenerateLogsForAppliance();

  return useSupabaseMutation(
    ({ applianceId, updates }: { applianceId: string, updates: any }) =>
      applianceService.updateAppliance(applianceId, updates),
    {
      onSuccess: (data) => {
        if (data) {
          const rate = rateData?.data?.rate_per_kwh ?? 12.45;
          generateLogs.mutate({ appliance: data, rate });
          queryClient.invalidateQueries({ queryKey: queryKeys.appliances.all(data.user_id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.appliances.detail(data.id) });
        }
      },
    }
  );
}

export function useDeleteAppliance() {
  return useSupabaseMutation(
    (applianceId: string) => applianceService.deleteAppliance(applianceId),
    {
      invalidateKeys: [['energy'], ['appliances']],
    }
  );
}

export function useUpdateBudget() {
  return useSupabaseMutation(
    ({ budgetId, updates }: { budgetId: string, updates: any }) =>
      budgetService.updateBudget(budgetId, updates),
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.invalidateQueries({ queryKey: queryKeys.energy.budget(data.user_id) });
          // Also invalidate the budget alert and dashboard so they re-check immediately
          queryClient.invalidateQueries({ queryKey: queryKeys.energy.budgetAlert(data.user_id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.energy.dashboard(data.user_id) });
          // invalidateQueries only auto-refetches queries that currently have an
          // active mounted observer. useBudgetAlert only lives on the Dashboard,
          // so if the budget is edited from the Profile screen (as it is here),
          // nothing would actually re-run the alert check until the user happens
          // to revisit the Dashboard — meaning the "approaching budget" notification
          // would never get created. Run the check directly here so it fires
          // immediately, regardless of which screen is currently mounted.
          budgetService.checkBudgetAlerts(data.user_id);
        }
      },
    }
  );
}

// ─── Historical analytics & mock data ───────────────────────────────────

export function useGenerateLogsForAppliance() {
  return useSupabaseMutation(
    ({ appliance, rate }: { appliance: Appliance; rate: number }) =>
      energyService.generateLogsForAppliance(appliance, rate),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['energy'] });
      },
    }
  );
}

export function useGenerateEnergyLogs() {
  const client = useQueryClient();

  return useSupabaseMutation(
    (userId: string) => energyService.generateDailyEnergyLogs(userId),
    {
      invalidateKeys: [['energy'] as const],
      onSuccess: (_data, userId) => {
        const title = 'Data Generated';
        const body = 'Energy usage data has been generated successfully for your active appliances.';

        supabase.from('notifications').insert({
          user_id: userId,
          title,
          message: body,
          type: 'energy_data',
          is_read: false,
        }).then(() => {
          client.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
          client.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
        });

        showAppAlert({ title, message: body, type: 'success' });
        sendLocalPush(title, body, { url: '/(app)/notifications' });
      },
      onError: (error: any) => {
        const title = 'Unable to Generate Data';
        const body = error?.message || 'Please ensure you have at least one active appliance with recorded usage.';
        showAppAlert({ title, message: body, type: 'error' });
        sendLocalPush(title, body, { url: '/(app)/notifications' });
      },
    }
  );
}

// ─── Admin hooks ────────────────────────────────────────────────────────

export function useAdminConfig() {
  return useSupabaseQuery(
    queryKeys.admin.config(),
    () => adminService.getAdminConfig(),
  );
}

export function useUpdateAdminConfig() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ generateDataEnabled, adminId }: { generateDataEnabled: boolean; adminId: string }) =>
      adminService.updateAdminConfig({ generate_data_enabled: generateDataEnabled }, adminId),
    {
      invalidateKeys: [['admin']],
    }
  );
}

export function useUpdateRate() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ rateId, ratePerKwh }: { rateId: string; ratePerKwh: number }) =>
      adminService.updateRate(rateId, ratePerKwh),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.energy.rate() });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.ratePlan() });
      },
    }
  );
}

export function useActiveRatePlan() {
  return useSupabaseQuery(
    queryKeys.admin.ratePlan(),
    () => adminService.getActiveRatePlan(),
  );
}

// ─── Budget alerts & Notifications ──────────────────────────────────────

export function useBudgetAlert(userId: string) {
  return useSupabaseQuery<BudgetAlert | null>(
    queryKeys.energy.budgetAlert(userId),
    () => budgetService.checkBudgetAlerts(userId),
    { enabled: !!userId }
  );
}

export function useNotifications(userId: string) {
  return useSupabaseQuery(
    queryKeys.notifications.all(userId),
    async () => {
      const { data, error } = await budgetService.getUserNotifications(userId);
      if (error) throw error;
      return data;
    },
    { enabled: !!userId }
  );
}

export function useUnreadNotificationsCount(userId: string) {
  return useSupabaseQuery(
    queryKeys.notifications.unreadCount(userId),
    async () => {
      const { count, error } = await budgetService.countUnreadNotifications(userId);
      if (error) throw error;
      return count;
    },
    { enabled: !!userId, refetchInterval: 30000 } // Poll every 30s
  );
}

export function useMarkNotificationRead() {
  return useSupabaseMutation(
    (notificationId: string) => budgetService.markNotificationRead(notificationId),
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(data.user_id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(data.user_id) });
        }
      },
    }
  );
}