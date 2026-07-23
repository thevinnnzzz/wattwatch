// applianceService.ts - Manage user appliances
import { supabase } from '@/lib/supabase';
import type { Appliance, ApplianceInsert, ApplianceUpdate } from '@/types/database';

export const applianceService = {
  // Get all appliances for a user
  getAppliances: async (userId: string) => {
    const { data, error } = await supabase
      .from('appliances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get a single appliance
  getAppliance: async (applianceId: string) => {
    const { data, error } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', applianceId)
      .single();
    return { data, error };
  },

  // Create a new appliance
  createAppliance: async (appliance: ApplianceInsert) => {
    const { data, error } = await supabase
      .from('appliances')
      .insert(appliance)
      .select()
      .single();
    return { data, error };
  },

  // Update an appliance
  updateAppliance: async (applianceId: string, updates: ApplianceUpdate) => {
    const { data, error } = await supabase
      .from('appliances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', applianceId)
      .select()
      .single();
    return { data, error };
  },

  // Delete an appliance
  deleteAppliance: async (applianceId: string) => {
    const { data, error } = await supabase
      .from('appliances')
      .delete()
      .eq('id', applianceId);
    return { data, error };
  },

  // Get the appliance catalog
  getApplianceCatalog: async () => {
    const { data, error } = await supabase
      .from('appliance_catalog')
      .select('*')
      .order('name', { ascending: true });
    return { data, error };
  },
};

export default applianceService;
