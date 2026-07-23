// Notifications hook for push notifications
import { useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Lazy-load native modules that may not be available in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('expo-notifications not available (likely running in Expo Go). Push notifications require a development build.');
}

try {
  Device = require('expo-device');
} catch {
  console.warn('expo-device not available.');
}

type NotificationsType = typeof import('expo-notifications');
const N = (): NotificationsType => {
  if (!Notifications) throw new Error('expo-notifications unavailable');
  return Notifications;
};

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Skip if notifications unavailable (Expo Go) or if user hasn't loaded yet
    if (!Notifications || !Device) return;
    // Wait for user to be available so we can save the token
    if (!user?.id) return;
    // Only register once per user session
    if (hasRegistered.current) return;
    hasRegistered.current = true;

    registerForPushNotificationsAsync();

    const subscription = N().addNotificationReceivedListener((n) => {
      console.log('Notification received in foreground:', n.request.content.title);
    });

    const responseSubscription = N().addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'bill_reminder' || data?.type === 'due_reminder') {
        // Navigate to bill
      } else if (data?.type === 'payment_confirmed') {
        // Navigate to payment
      } else if (data?.type === 'announcement') {
        // Navigate to announcement
      } else if (data?.type === 'ticket_update') {
        // Navigate to ticket
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [user?.id]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web' || !Notifications || !Device) return;
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device.');
      return;
    }

    try {
      const { status: existingStatus } = await N().getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await N().requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted.');
        Alert.alert('Notifications', 'Please enable notifications in Settings to receive alerts.');
        return;
      }

      const token = (await N().getExpoPushTokenAsync()).data;
      console.log('Expo push token obtained:', token);
      setExpoPushToken(token);

      // Save token to user profile
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);
        if (error) {
          console.error('Failed to save push token to profile:', error);
        } else {
          console.log('Push token saved to profile for user:', user.id);
        }
      }

      // Send a test local notification so we can verify notifications are working on-device
      await N().scheduleNotificationAsync({
        content: {
          title: 'Notifications Ready',
          body: 'You will now receive alerts from PowerConnect.',
          sound: true,
        },
        trigger: null,
      });
      console.log('Test local notification sent — check your device.');
    } catch (err) {
      console.error('Error during push token registration:', err);
      Alert.alert('Notification Error', String(err));
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    if (!Notifications) return;
    try {
      await N().scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null,
      });
    } catch (err) {
      console.error('sendLocalNotification error:', err);
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: { seconds?: number; date?: Date },
    data?: any
  ) => {
    if (!Notifications) return;
    try {
      await N().scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger,
      });
    } catch (err) {
      console.error('scheduleNotification error:', err);
    }
  };

  const sendPushNotification = async (userId: string, title: string, message: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .single();

    if (error || !data?.expo_push_token) {
      console.warn('sendPushNotification: Could not retrieve push token for user:', userId, error);
      Alert.alert('Push Error', 'No push token found for this user. Has the user registered on a physical device?');
      return;
    }

    console.log('Invoking Edge Function with token:', data.expo_push_token.substring(0, 20) + '...');

    const { data: funcData, error: funcError } = await supabase.functions.invoke('send-notification', {
      body: {
        expo_push_token: data.expo_push_token,
        title,
        message,
      },
    });

    if (funcError) {
      console.error('sendPushNotification: Edge function error:', funcError);
      Alert.alert('Push Error', `Edge function error: ${funcError.message}`);
      return;
    }

    console.log('Edge function response:', funcData);
    Alert.alert('Push Sent', `Response: ${JSON.stringify(funcData)}`);
  };

  return {
    expoPushToken,
    sendLocalNotification,
    scheduleNotification,
    sendPushNotification,
  };
}