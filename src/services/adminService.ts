import { supabase } from '@/lib/supabase';
import type { AdminConfig } from '@/types/database';

export const adminService = {
  getAdminConfig: async (): Promise<{ data: AdminConfig | null; error: any }> => {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .limit(1)
      .single();
    return { data, error };
  },

  updateAdminConfig: async (updates: Partial<Pick<AdminConfig, 'generate_data_enabled'>>, adminId: string) => {
    const { data, error } = await supabase
      .from('admin_config')
      .update({ ...updates, updated_by: adminId, updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('admin_config').select('id').limit(1).single()).data?.id ?? '')
      .select()
      .single();
    return { data, error };
  },

  updateRate: async (rateId: string, ratePerKwh: number) => {
    const { data, error } = await supabase
      .from('rate_plans')
      .update({ rate_per_kwh: ratePerKwh, updated_at: new Date().toISOString() })
      .eq('id', rateId)
      .select()
      .single();
    return { data, error };
  },

  getActiveRatePlan: async () => {
    const { data, error } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  },
};
