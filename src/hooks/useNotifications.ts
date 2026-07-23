// Notifications hook for push notifications
import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Handle notification received while app is foreground
    const subscription = Notifications.addNotificationReceivedListener(setNotification);

    // Handle notification tap
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!Device.isDevice) {
      Alert.alert('Must use physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    })).data;

    setExpoPushToken(token);

    // Save token to user profile
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', user.id);
    }
  };

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Handle deep linking based on notification type
    if (data?.type === 'bill_reminder' || data?.type === 'due_reminder') {
      // Navigate to bill
    } else if (data?.type === 'payment_confirmed') {
      // Navigate to payment
    } else if (data?.type === 'announcement') {
      // Navigate to announcement
    } else if (data?.type === 'ticket_update') {
      // Navigate to ticket
    }
  }, []);

  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
  };

  return {
    expoPushToken,
    notification,
    sendLocalNotification,
    scheduleNotification,
  };
}

import { useState } from 'react';