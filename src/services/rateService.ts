// rateService.ts - Manage electricity rates
import { supabase } from '@/lib/supabase';
import type { ElectricityRate } from '@/types/database';

export const rateService = {
  // Get the current active electricity rate
  getActiveRate: async () => {
    const { data, error } = await supabase
      .from('rate_plans')
      .select('rate_per_kwh')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    // Provide a default if none is set in the DB
    if (error || !data) {
      return { data: { rate_per_kwh: 12.45 }, error: null };
    }

    return { data, error };
  },
};

export default rateService;
