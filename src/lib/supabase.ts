// Supabase configuration and client setup
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Conditional import for expo-secure-store (not available on web)
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('expo-secure-store not available, using fallback storage');
  }
}

// Custom storage adapter with fallback for web
const createSecureStorage = () => {
  return {
    getItem: async (key: string) => {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key);
        }
        return null;
      }
      if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      }
      // Fallback for development without native module
      if (typeof globalThis !== 'undefined' && (globalThis as any).__expoSecureStore) {
        return (globalThis as any).__expoSecureStore[key] || null;
      }
      return null;
    },
    setItem: async (key: string, value: string) => {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
          return;
        }
        return;
      }
      if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      // Fallback for development without native module
      if (typeof globalThis !== 'undefined') {
        if (!(globalThis as any).__expoSecureStore) {
          (globalThis as any).__expoSecureStore = {};
        }
        (globalThis as any).__expoSecureStore[key] = value;
      }
    },
    removeItem: async (key: string) => {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
          return;
        }
        return;
      }
      if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
      // Fallback for development without native module
      if (typeof globalThis !== 'undefined' && (globalThis as any).__expoSecureStore) {
        delete (globalThis as any).__expoSecureStore[key];
      }
    },
  };
};

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
  console.warn('Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createSecureStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'implicit',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helpers
export const auth = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data,
        emailRedirectTo: Linking.createURL('/(auth)/verify'),
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Reset password request
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/(auth)/update-password'),
    });
    return { data, error };
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  },

  // Verify OTP
  verifyOtp: async (email: string, token: string, type: 'signup' | 'recovery' = 'signup') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { data, error };
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: Linking.createURL('/(auth)/verify'),
      },
    });
    return { data, error };
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Refresh session
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  },
};

// Database helpers
export const db = {
  // Profiles
  profiles: {
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },
    upsert: async (profile: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single();
      return { data, error };
    },
    update: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Accounts
  accounts: {
    list: async (userId: string) => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },
    get: async (accountId: string) => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      return { data, error };
    },
    create: async (account: any) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      return { data, error };
    },
    update: async (accountId: string, updates: any) => {
      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', accountId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Bills
  bills: {
    list: async (accountId: string, options?: { limit?: number; offset?: number; status?: string }) => {
      let query = supabase
        .from('bills')
        .select('*')
        .eq('account_id', accountId)
        .order('billing_period_start', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    },
    get: async (billId: string) => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();
      return { data, error };
    },
    getWithPayments: async (billId: string) => {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          payments (*)
        `)
        .eq('id', billId)
        .single();
      return { data, error };
    },
  },

  // Payments
  payments: {
    list: async (accountId: string, options?: { limit?: number; offset?: number }) => {
      let query = supabase
        .from('payments')
        .select('*')
        .eq('account_id', accountId)
        .order('payment_date', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    },
    get: async (paymentId: string) => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      return { data, error };
    },
  },

  // Announcements
  announcements: {
    list: async (options?: { limit?: number; offset?: number; type?: string; isPublished?: boolean }) => {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('publish_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.isPublished !== undefined) {
        query = query.eq('is_published', options.isPublished);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    },
    get: async (announcementId: string) => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single();
      return { data, error };
    },
  },

  // Notifications
  notifications: {
    list: async (userId: string, options?: { limit?: number; offset?: number; isRead?: boolean }) => {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.isRead !== undefined) {
        query = query.eq('is_read', options.isRead);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error, count } = await query;
      return { data, error, count };
    },
    markRead: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      return { data, error };
    },
    markAllRead: async (userId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return { data, error };
    },
    getUnreadCount: async (userId: string) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return { count, error };
    },
  },

  // Tickets
  tickets: {
    list: async (userId: string, options?: { limit?: number; offset?: number }) => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          ticket_messages (
            id,
            message,
            is_from_admin,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    },
    get: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_messages (
            id,
            user_id,
            message,
            is_from_admin,
            created_at,
            user:profiles (full_name, avatar_url)
          )
        `)
        .eq('id', ticketId)
        .single();
      return { data, error };
    },
    create: async (ticket: any) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();
      return { data, error };
    },
    addMessage: async (message: any) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert(message)
        .select()
        .single();
      return { data, error };
    },
    subscribe: (ticketId: string, callback: (payload: any) => void) => {
      return supabase
        .channel(`ticket:${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${ticketId}`,
          },
          callback
        )
        .subscribe();
    },
  },

  // Settings
  settings: {
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      return { data, error };
    },
    upsert: async (settings: any) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert(settings)
        .select()
        .single();
      return { data, error };
    },
  },

  // Storage
  storage: {
    uploadAvatar: async (userId: string, file: Blob, fileName: string) => {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });
      return { data, error };
    },
    getAvatarUrl: (userId: string, fileName: string) => {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/${fileName}`);
      return data.publicUrl;
    },
    uploadBill: async (billId: string, file: Blob, fileName: string) => {
      const { data, error } = await supabase.storage
        .from('bills')
        .upload(`${billId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });
      return { data, error };
    },
    getBillUrl: (billId: string, fileName: string) => {
      const { data } = supabase.storage
        .from('bills')
        .getPublicUrl(`${billId}/${fileName}`);
      return data.publicUrl;
    },
    createSignedBillUrl: async (billId: string, fileName: string, expiresIn = 3600) => {
      const { data, error } = await supabase.storage
        .from('bills')
        .createSignedUrl(`${billId}/${fileName}`, expiresIn);
      return { data, error };
    },
    uploadAttachment: async (ticketId: string, file: Blob, fileName: string) => {
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(`${ticketId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });
      return { data, error };
    },
  },
};

// Real-time subscriptions
export const realtime = {
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToAnnouncements: (callback: (payload: any) => void) => {
    return supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: 'is_published=eq.true',
        },
        callback
      )
      .subscribe();
  },
};

export default supabase;