// Auth hook for managing authentication state
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import * as Linking from 'expo-linking';

export function useAuth() {
  const { user, session, profile, setUser, setSession, setProfile, setLoading, loading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setProfile(profile);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profile) setProfile(profile);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setProfile, setLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to sign in' } };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    userData: { fullName: string; phoneNumber: string }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone_number: userData.phoneNumber,
          },
          emailRedirectTo: Linking.createURL('/(auth)/verify-success'),
        },
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to sign up' } };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to sign out' } };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/(auth)/reset-password'),
    });
    return { data, error };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profile) setProfile(profile);
    } catch (error) {
      console.error('Profile refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setProfile, setLoading]);

  return {
    user,
    session,
    profile,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };
}