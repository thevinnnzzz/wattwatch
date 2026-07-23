import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Loading';
import { usePalette } from '@/constants/usePalette';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useSupabaseQuery';
import { useNotifications as usePushNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const { data, isLoading, refetch: refetchNotifications } = useNotifications(profile?.id ?? '');
  const { mutate: markRead } = useMarkNotificationRead();
  const { sendLocalNotification, sendPushNotification } = usePushNotifications();
  const p = usePalette();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchNotifications();
    setRefreshing(false);
  }, [refetchNotifications]);

  const notifications = (data ?? []).filter(
    (item, index, arr) => index === arr.findIndex((n) => n.title === item.title && n.message === item.message)
  );

  const handleMarkRead = useCallback((item: any) => {
    if (!item.is_read) {
      markRead(item.id);
    }
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    const unread = notifications.filter((n: any) => !n.is_read);
    unread.forEach((n: any) => markRead(n.id));
  }, [notifications, markRead]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const unread = data.filter((n: any) => !n.is_read);
    if (unread.length > 0) {
      unread.forEach((n: any) => markRead(n.id));
    }
  }, [data, markRead]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.notificationItem, !item.is_read && styles.notificationUnread]}
      onPress={() => handleMarkRead(item)}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: 'bold', color: !item.is_read ? p.text : p.textMuted }}>
          {item.title}
        </ThemedText>
        <ThemedText style={{ color: !item.is_read ? p.text : p.textMuted }}>
          {item.message}
        </ThemedText>
        <ThemedText style={{ fontSize: 11, color: p.textMuted, marginTop: Spacing.one }}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </ThemedText>
      </View>
      {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: p.gold }]} />}
    </Pressable>
  );

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Notifications</ThemedText>
          {notifications.some((n: any) => !n.is_read) && (
            <Button title="Mark All Read" size="sm" variant="outline" onPress={handleMarkAllRead} />
          )}
        </ThemedView>
        {notifications.length === 0 ? (
          <EmptyState title="No Notifications" description="Important alerts and updates will appear here." />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: p.divider }} />}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.three },
  notificationItem: {
    padding: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  notificationUnread: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
