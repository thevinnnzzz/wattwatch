import { ThemedText } from '@/components/themed-text';
import Spinner from '@/components/ui/Loading';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications as usePushNotifications } from '@/hooks/useNotifications';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useSupabaseQuery';
import { queryClient, queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, PixelRatio, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const { data, isLoading, refetch: refetchNotifications } = useNotifications(profile?.id ?? '');
  const { mutate: markRead } = useMarkNotificationRead();
  const { sendLocalNotification, sendPushNotification } = usePushNotifications();
  const p = usePalette();

  const { width } = useWindowDimensions();

  const scale = useMemo(() => {
    const raw = width / BASE_WIDTH;
    return Math.min(Math.max(raw, 0.85), 1.25);
  }, [width]);

  const rf = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

  const isSmallScreen = width < 360;
  const isTablet = width >= 768;

  const styles = useMemo(() => createStyles(rf, isSmallScreen, isTablet, p), [rf, isSmallScreen, isTablet, p]);

  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchNotifications();
    setRefreshing(false);
  }, [refetchNotifications]);

  const notifications = useMemo(() => {
    return (data ?? []).filter(
      (item, index, arr) => index === arr.findIndex((n) => n.title === item.title && n.message === item.message)
    );
  }, [data]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n: any) => !n.is_read).length;
  }, [notifications]);

  const handleMarkRead = useCallback((item: any) => {
    if (!item.is_read) {
      markRead(item.id);
    }
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    const unread = notifications.filter((n: any) => !n.is_read);
    unread.forEach((n: any) => markRead(n.id));
  }, [notifications, markRead]);

  const handleClearAll = useCallback(() => {
    if (!profile?.id) return;
    setShowClearConfirm(true);
  }, [profile?.id]);

  const confirmClearAll = useCallback(async () => {
    if (!profile?.id) return;
    await supabase.from('notifications').delete().eq('user_id', profile.id);
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(profile.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(profile.id) });
    setShowClearConfirm(false);
  }, [profile?.id]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const unread = data.filter((n: any) => !n.is_read);
    if (unread.length > 0) {
      unread.forEach((n: any) => markRead(n.id));
    }
  }, [data, markRead]);

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !item.is_read;
    
    return (
      <Pressable
        onPress={() => handleMarkRead(item)}
        style={({ pressed }) => [
          styles.card,
          isUnread && styles.cardUnread,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, isUnread && styles.iconContainerUnread]}>
            <Ionicons 
              name={isUnread ? "notifications" : "notifications-outline"} 
              size={rf(22)} 
              color={isUnread ? p.gold : p.navy} 
            />
            {isUnread && <View style={[styles.statusDot, { backgroundColor: p.gold }]} />}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <ThemedText
                style={[styles.notificationTitle, !isUnread && { color: p.textMuted }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {item.title}
              </ThemedText>
            </View>

            <ThemedText
              style={[styles.notificationMessage, !isUnread && { color: p.textMuted }]}
              maxFontSizeMultiplier={1.2}
            >
              {item.message}
            </ThemedText>

            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={rf(11)} color={p.textMuted} style={{ marginRight: 3 }} />
              <ThemedText style={styles.timeText} maxFontSizeMultiplier={1.2}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right']}>
      <View style={styles.headerOuter}>
        <View style={styles.headerTextContainer}>
          <ThemedText style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
            Notifications
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} maxFontSizeMultiplier={1.2}>
            {unreadCount > 0 ? `${unreadCount} Unread Alerts` : `${notifications.length} Total Notifications`}
          </ThemedText>
        </View>

          {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="checkmark-done" size={rf(16)} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>
                  Mark All Read
                </ThemedText>
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable
                onPress={handleClearAll}
                style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="trash-outline" size={rf(16)} color={p.error} />
                <ThemedText style={[styles.actionButtonText, { color: p.error }]} maxFontSizeMultiplier={1.2}>
                  Clear All
                </ThemedText>
              </Pressable>
            )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={rf(48)} color={p.textMuted} />
          <ThemedText style={styles.emptyTitle} maxFontSizeMultiplier={1.2}>
            No Notifications
          </ThemedText>
          <ThemedText style={styles.emptySubtitle} maxFontSizeMultiplier={1.2}>
            Important alerts and updates will appear here.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
        <Modal transparent visible={showClearConfirm} animationType="fade" onRequestClose={() => setShowClearConfirm(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowClearConfirm(false)}>
            <Pressable onPress={() => {}} style={[styles.clearModalDialog, { backgroundColor: p.card ?? p.bg }]}>
              <Ionicons name="trash-outline" size={48} color={p.error} />
              <ThemedText style={styles.clearModalTitle}>Clear All Notifications</ThemedText>
              <ThemedText style={[styles.clearModalMessage, { color: p.textMuted }]}>
                This will permanently delete all notifications. Continue?
              </ThemedText>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: p.divider }]}
                  onPress={() => setShowClearConfirm(false)}
                >
                  <ThemedText style={[styles.modalButtonText, { color: p.text }]}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: p.error }]}
                  onPress={confirmClearAll}
                >
                  <ThemedText style={styles.modalButtonText}>Clear All</ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
    </SafeAreaView>
  );
}

const createStyles = (
  rf: (n: number) => number,
  isSmallScreen: boolean,
  isTablet: boolean,
  p: any
) =>
  StyleSheet.create({
    headerOuter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? Spacing.three : Spacing.four,
      paddingTop: Spacing.three,
      paddingBottom: Spacing.four,
    },
    headerTextContainer: {
      flex: 1,
      marginRight: Spacing.two,
    },
    headerTitle: {
      fontWeight: '800',
      fontSize: rf(24),
      color: p.text,
    },
    headerSubtitle: {
      color: p.textMuted,
      fontWeight: '500',
      fontSize: rf(12),
      marginTop: 2,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.navy,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
      shadowColor: p.navy,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: rf(12),
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
      borderWidth: 1,
      borderColor: p.error,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    clearModalDialog: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 20,
      padding: Spacing.five,
      alignItems: 'center',
      gap: Spacing.three,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    clearModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    clearModalMessage: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.three,
      marginTop: Spacing.two,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: isSmallScreen ? Spacing.three : Spacing.four,
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      backgroundColor: p.card ?? '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: p.divider,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardUnread: {
      borderColor: p.gold,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      position: 'relative',
    },
    iconContainerUnread: {
      backgroundColor: 'rgba(255, 140, 0, 0.1)',
    },
    statusDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      position: 'absolute',
      top: 3,
      right: 3,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    infoContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    notificationTitle: {
      fontWeight: '700',
      fontSize: rf(15),
      color: p.text,
    },
    notificationMessage: {
      fontSize: rf(13),
      color: p.text,
      lineHeight: rf(18),
      marginBottom: 8,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeText: {
      fontWeight: '500',
      fontSize: rf(11),
      color: p.textMuted,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.eight,
    },
    emptyTitle: {
      fontWeight: '700',
      fontSize: rf(16),
      color: p.text,
      marginTop: Spacing.two,
    },
    emptySubtitle: {
      color: p.textMuted,
      textAlign: 'center',
      fontSize: rf(14),
      marginTop: Spacing.one,
    },
  });