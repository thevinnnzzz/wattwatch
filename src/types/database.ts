// Database types for WattWatch - mirrors Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone_number: string | null;
          email: string | null;
          address: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone_number?: string | null;
          email?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone_number?: string | null;
          email?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      appliances: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          wattage: number;
          hours_used_daily: number;
          is_active: boolean;
          icon_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          wattage: number;
          hours_used_daily?: number;
          is_active?: boolean;
          icon_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          wattage?: number;
          hours_used_daily?: number;
          is_active?: boolean;
          icon_name?: string | null;
          updated_at?: string;
        };
      };
      appliance_catalog: {
        Row: {
          id: string;
          name: string;
          category: string;
          default_wattage: number;
          icon_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          default_wattage: number;
          icon_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          default_wattage?: number;
          icon_name?: string | null;
        };
      };
      energy_logs: {
        Row: {
          id: string;
          user_id: string;
          appliance_id: string | null;
          kwh_consumed: number;
          cost_per_day: number;
          date: string; // YYYY-MM-DD
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          appliance_id?: string | null;
          kwh_consumed: number;
          cost_per_day?: number;
          date?: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          appliance_id?: string | null;
          kwh_consumed?: number;
          cost_per_day?: number;
          date?: string;
          is_demo?: boolean;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          monthly_limit: number;
          alert_threshold_pct: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_limit?: number;
          alert_threshold_pct?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_limit?: number;
          alert_threshold_pct?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      rate_plans: {
        Row: {
          id: string;
          rate_name: string;
          rate_per_kwh: number;
          is_active: boolean;
          effective_from: string;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rate_name: string;
          rate_per_kwh: number;
          is_active?: boolean;
          effective_from?: string;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rate_name?: string;
          rate_per_kwh?: number;
          is_active?: boolean;
          effective_from?: string;
          effective_to?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          dark_mode: boolean;
          push_notifications: boolean;
          email_notifications: boolean;
          budget_alerts: boolean;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dark_mode?: boolean;
          push_notifications?: boolean;
          email_notifications?: boolean;
          budget_alerts?: boolean;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dark_mode?: boolean;
          push_notifications?: boolean;
          email_notifications?: boolean;
          budget_alerts?: boolean;
          language?: string;
          updated_at?: string;
        };
      };
      admin_config: {
        Row: {
          id: string;
          generate_data_enabled: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          generate_data_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          generate_data_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      notification_type: 'budget_alert' | 'usage_summary' | 'tip_of_the_day' | 'system';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Appliance = Database['public']['Tables']['appliances']['Row'];
export type ApplianceInsert = Database['public']['Tables']['appliances']['Insert'];
export type ApplianceUpdate = Database['public']['Tables']['appliances']['Update'];

export type ApplianceCatalogItem = Database['public']['Tables']['appliance_catalog']['Row'];

export type EnergyLog = Database['public']['Tables']['energy_logs']['Row'];
export type EnergyLogInsert = Database['public']['Tables']['energy_logs']['Insert'];

export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export type RatePlan = Database['public']['Tables']['rate_plans']['Row'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type Settings = Database['public']['Tables']['settings']['Row'];
export type SettingsInsert = Database['public']['Tables']['settings']['Insert'];
export type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

export type AdminConfig = Database['public']['Tables']['admin_config']['Row'];

// Enums
export type NotificationType = Database['public']['Enums']['notification_type'];
