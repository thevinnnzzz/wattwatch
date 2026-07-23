// Auth service - Supabase authentication operations
import { supabase, auth, db } from '@/lib/supabase';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/database';
import { Linking } from 'expo-linking';

export const authService = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, userData: { fullName: string; phoneNumber: string }) => {
    const { data, error } = await auth.signUp(email, password, {
      data: {
        full_name: userData.fullName,
        phone_number: userData.phoneNumber,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await auth.signOut();
    return { error };
  },

  // Reset password request
  resetPassword: async (email: string) => {
    const { data, error } = await auth.resetPassword(email);
    return { data, error };
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await auth.updatePassword(password);
    return { data, error };
  },

  // Verify OTP
  verifyOtp: async (email: string, token: string, type: 'signup' | 'recovery' = 'signup') => {
    const { data, error } = await auth.verifyOtp(email, token, type);
    return { data, error };
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    const { data, error } = await auth.resendVerification(email);
    return { data, error };
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await auth.getSession();
    return { data, error };
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await auth.getUser();
    return { data, error };
  },

  // Refresh session
  refreshSession: async () => {
    const { data, error } = await auth.refreshSession();
    return { data, error };
  },

  // Get profile
  getProfile: async (userId: string) => {
    const { data, error } = await db.profiles.get(userId);
    return { data, error };
  },

  // Update profile
  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    const { data, error } = await db.profiles.update(userId, updates);
    return { data, error };
  },

  // Upload avatar
  uploadAvatar: async (userId: string, file: Blob, fileName: string) => {
    const { data, error } = await db.storage.uploadAvatar(userId, file, fileName);
    return { data, error };
  },

  // Get avatar URL
  getAvatarUrl: (userId: string, fileName: string) => {
    return db.storage.getAvatarUrl(userId, fileName);
  },
};

export default authService;