// Settings store for user preferences
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface SettingsState {
  // Notification settings
  pushNotifications: boolean;
  emailNotifications: boolean;
  billReminders: boolean;
  dueReminders: boolean;
  announcementAlerts: boolean;

  // Display settings
  language: string;
  currency: string;
  dateFormat: string;

  // Privacy
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;

  // Actions
  setPushNotifications: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setBillReminders: (enabled: boolean) => void;
  setDueReminders: (enabled: boolean) => void;
  setAnnouncementAlerts: (enabled: boolean) => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setDateFormat: (format: string) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setCrashReportingEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  pushNotifications: true,
  emailNotifications: true,
  billReminders: true,
  dueReminders: true,
  announcementAlerts: true,
  language: 'en',
  currency: 'PHP',
  dateFormat: 'MM/dd/yyyy',
  analyticsEnabled: true,
  crashReportingEnabled: true,
};

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setBillReminders: (billReminders) => set({ billReminders }),
      setDueReminders: (dueReminders) => set({ dueReminders }),
      setAnnouncementAlerts: (announcementAlerts) => set({ announcementAlerts }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
      setCrashReportingEnabled: (crashReportingEnabled) => set({ crashReportingEnabled }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);