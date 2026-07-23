import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Loading';
import { LP } from '@/constants/loginPalette';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useSupabaseQuery';
import { formatDistanceToNow } from 'date-fns';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const { data, isLoading } = useNotifications(profile?.id ?? '');
  const { mutate: markRead } = useMarkNotificationRead();

  const notifications = data ?? [];

  const handleMarkRead = useCallback((item: any) => {
    if (!item.is_read) {
      markRead(item.id);
    }
  }, [markRead]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.notificationItem, !item.is_read && styles.notificationUnread]}
      onPress={() => handleMarkRead(item)}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: 'bold', color: !item.is_read ? LP.text : LP.textMuted }}>
          {item.title}
        </ThemedText>
        <ThemedText style={{ color: !item.is_read ? LP.text : LP.textMuted }}>
          {item.message}
        </ThemedText>
        <ThemedText style={{ fontSize: 11, color: LP.textMuted, marginTop: Spacing.one }}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </ThemedText>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </Pressable>
  );

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LP.bg }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Notifications</ThemedText>
        </ThemedView>
        {notifications.length === 0 ? (
          <EmptyState title="No Notifications" description="Important alerts and updates will appear here." />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: LP.divider }} />}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  header: { alignItems: 'center', paddingBottom: Spacing.three },
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
    backgroundColor: LP.gold,
  },
});