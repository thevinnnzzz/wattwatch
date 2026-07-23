import { useEffect } from 'react';
import { router } from 'expo-router';

let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('expo-notifications not available');
}

export function NotificationTapHandler() {
  useEffect(() => {
    if (!Notifications) return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}
