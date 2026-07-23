// Auth state listener component
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import { useSegments } from 'expo-router';

export function AuthListener() {
  const { user, initialized, setInitialized, setUser, setSession, setProfile, setLoading } = useAuthStore();
  const segments = useSegments();
  const wasInitialized = useRef(false);
  const prevUser = useRef(user);

  // Navigate only when user transitions (null -> user or user -> null)
  useEffect(() => {
    if (!initialized) return;

    // Skip the very first render after initialization — segments already in sync
    if (!wasInitialized.current) {
      wasInitialized.current = true;
      prevUser.current = user;
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const prevUserVal = prevUser.current;
    prevUser.current = user;

    // User just signed in
    if (!prevUserVal && user) {
      if (inAuthGroup) {
        router.replace('/(app)/');
      }
      return;
    }

    // User just signed out
    if (prevUserVal && !user) {
      router.replace('/(auth)/');
      return;
    }
  }, [user, initialized, segments]);

  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser(session.user);

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
  }, [initialized, setInitialized, setUser, setSession, setProfile, setLoading]);

  return null;
}