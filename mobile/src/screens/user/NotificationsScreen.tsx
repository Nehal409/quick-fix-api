import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { notificationsApi } from '../../lib/api';
import type { Notification } from '../../types';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams, UserTabParams } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParams, 'Notifications'>,
  NativeStackScreenProps<RootStackParams>
>;

type GroupedNotifications = {
  now: Notification[];
  today: Notification[];
  earlier: Notification[];
  unreadCount: number;
};

const TYPE_ICON: Record<string, { icon: string; bg: string; color: string }> = {
  booking_confirmed: { icon: '✅', bg: '#E8F5E9', color: '#2E7D32' },
  booking_cancelled: { icon: '❌', bg: '#FFEBEE', color: '#C62828' },
  provider_en_route: { icon: '🚗', bg: '#FFF3E0', color: '#E65100' },
  job_completed:     { icon: '🎉', bg: '#E8F5E9', color: '#2E7D32' },
  auto_rescheduled:  { icon: '🔄', bg: '#FFF8E1', color: '#F9A825' },
  dispute_resolved:  { icon: '⚖️', bg: '#F3E5F5', color: '#7B1FA2' },
  quote_ready:       { icon: '💰', bg: '#E3F2FD', color: '#1565C0' },
  price:             { icon: '💰', bg: '#E3F2FD', color: '#1565C0' },
  rate_provider:     { icon: '⭐', bg: '#FFFDE7', color: '#F57F17' },
  whatsapp:          { icon: '💬', bg: '#E8F5E9', color: '#2E7D32' },
  info:              { icon: 'ℹ️', bg: '#F3F4F6', color: '#374151' },
  alert:             { icon: '⚠️', bg: '#FFF8E1', color: '#F9A825' },
  default:           { icon: '🔔', bg: '#F5F5F5', color: '#757575' },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function NotifItem({ item, onPress }: { item: Notification; onPress: () => void }) {
  const meta = TYPE_ICON[item.type] ?? TYPE_ICON.default;
  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <Text style={styles.iconEmoji}>{meta.icon}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<GroupedNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: raw } = await notificationsApi.list();
      const inner = (raw as any)?.data ?? raw;
      const apiGroups: Array<{ title: string; items: any[] }> = inner?.groups ?? [];
      const unreadCount: number = inner?.unreadCount ?? 0;

      const mapItems = (items: any[]): Notification[] =>
        (items ?? []).map(item => ({
          id: item.id,
          type: item.type ?? 'default',
          title: item.title,
          body: item.body,
          read: item.read ?? false,
          createdAt: item.timestamp ?? item.createdAt ?? new Date().toISOString(),
          actionUrl: item.cta?.target ?? item.actionUrl,
        }));

      const findGroup = (...titles: string[]) =>
        mapItems(apiGroups.find(g => titles.includes(g.title))?.items ?? []);

      setData({
        now:     findGroup('now'),
        today:   findGroup('today'),
        earlier: findGroup('earlier', 'this_week', 'older'),
        unreadCount,
      });
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handlePress = useCallback(async (item: Notification) => {
    if (!item.read) {
      notificationsApi.markRead(item.id).catch(() => {});
      setData(prev => {
        if (!prev) return prev;
        const markRead = (list: Notification[]) =>
          list.map(n => n.id === item.id ? { ...n, read: true } : n);
        return {
          ...prev,
          now: markRead(prev.now),
          today: markRead(prev.today),
          earlier: markRead(prev.earlier),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        };
      });
    }
    if (item.actionUrl?.includes('booking')) {
      const parts = item.actionUrl.split('/');
      const bookingId = parts[parts.length - 1];
      if (bookingId) navigation.navigate('ActiveBooking', { bookingId });
    }
  }, [navigation]);

  const groups: { label: string; items: Notification[] }[] = data ? [
    { label: 'NOW',     items: data.now ?? [] },
    { label: 'TODAY',   items: data.today ?? [] },
    { label: 'EARLIER', items: data.earlier ?? [] },
  ].filter(g => g.items.length > 0) : [];

  const flatItems = groups.flatMap(g => [
    { type: 'header' as const, label: g.label, id: `h-${g.label}` },
    ...g.items.map(item => ({ type: 'item' as const, item, id: item.id })),
  ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inbox</Text>
          {(data?.unreadCount ?? 0) > 0 && (
            <Text style={styles.headerSub}>{data!.unreadCount} unread</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📭</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchNotifications()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : flatItems.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyDesc}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={flatItems}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return <Text style={styles.groupLabel}>{row.label}</Text>;
            }
            return <NotifItem item={row.item} onPress={() => handlePress(row.item)} />;
          }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 22, fontFamily: Fonts.latin.bold, color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  loadingText: { color: Colors.muted, fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { fontSize: 14, color: Colors.muted, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.sm, marginTop: 4 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.latin.bold, color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.muted },

  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemUnread: { backgroundColor: Colors.primary + '06' },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 20 },

  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  itemTitleUnread: { fontWeight: '800' },
  itemTime: { fontSize: 10, color: Colors.muted, flexShrink: 0 },
  itemBody: { fontSize: 13, color: Colors.muted, lineHeight: 18 },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
});
