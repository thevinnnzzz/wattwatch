// Auth store for managing authentication state
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Profile, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userData: { fullName: string; phoneNumber: string }) => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery') => Promise<{ error: any | null }>;
  resendVerification: (email: string) => Promise<{ error: any | null }>;
  refreshSession: () => Promise<{ error: any | null }>;

  // Initialize auth listener
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (email: string, password: string, userData: { fullName: string; phoneNumber: string }) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: userData.fullName,
                phone_number: userData.phoneNumber,
              },
            },
          });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null, profile: null });
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      resetPassword: async (email: string) => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'powerconnect://reset-password',
          });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      updatePassword: async (password: string) => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      verifyOtp: async (email: string, token: string, type: 'signup' | 'recovery') => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type,
          });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      resendVerification: async (email: string) => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
          });
          if (error) throw error;
          return { error: null };
        } catch (error: any) {
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) throw error;
          if (data.session) {
            set({ session: data.session, user: data.session.user });
          }
          return { error: null };
        } catch (error: any) {
          return { error };
        }
      },

      initialize: async () => {
        if (get().initialized) return;

        set({ loading: true });
        try {
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ session, user: session.user });

            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profile) set({ profile });
          }
        } catch (error) {
          console.error('Auth init error:', error);
        } finally {
          set({ loading: false, initialized: true });
        }

        // Set up auth state listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          if (session?.user) {
            set({ session, user: session.user });
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (profile) set({ profile });
            }
          } else {
            set({ session: null, user: null, profile: null });
          }
          set({ loading: false });
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    }
  )
);