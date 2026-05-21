import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { bookingsApi } from '../../lib/api';
import type { Booking, BookingStatus } from '../../types';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams, UserTabParams } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParams, 'Bookings'>,
  NativeStackScreenProps<RootStackParams>
>;

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Pending',      bg: '#FFF8E1', color: '#F9A825' },
  confirmed:        { label: 'Confirmed',    bg: '#E3F2FD', color: '#1565C0' },
  en_route:         { label: 'En Route',     bg: '#F3E5F5', color: '#7B1FA2' },
  in_progress:      { label: 'In Progress',  bg: '#E8F5E9', color: '#2E7D32' },
  completed:        { label: 'Completed',    bg: '#E8F5E9', color: '#2E7D32' },
  cancelled:        { label: 'Cancelled',    bg: '#FFEBEE', color: '#C62828' },
  auto_rescheduled: { label: 'Rescheduled',  bg: '#FFF3E0', color: '#E65100' },
  disputed:         { label: 'In Dispute',   bg: '#FFEBEE', color: '#D32F2F' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

export function BookingHistoryScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: raw } = await bookingsApi.list();
      const rawList: any[] = (raw as any)?.data?.bookings ?? (raw as any)?.bookings ?? (Array.isArray(raw) ? raw : []);
      const list: Booking[] = rawList.map((b: any) => {
        const addrObj = b?.address;
        const addressStr = addrObj && typeof addrObj === 'object'
          ? `${addrObj.sector ?? ''}, ${addrObj.city ?? ''}`.replace(/^,\s*|,\s*$/g, '')
          : (b?.address ?? undefined);
        const serviceObj = b?.service;
        const serviceStr = serviceObj && typeof serviceObj === 'object'
          ? serviceObj.label ?? serviceObj.category ?? 'Service'
          : (b?.service ?? undefined);
        return {
          id: b?.id ?? b?.uuid ?? '',
          status: b?.status ?? 'confirmed',
          scheduledAt: b?.scheduledAt ?? '',
          address: addressStr,
          service: serviceStr,
          totalPrice: b?.quotedTotal ?? b?.finalTotal ?? b?.totalPrice ?? 0,
          provider: {
            id: b?.provider?.providerUuid ?? b?.provider?.id ?? '',
            name: b?.provider?.displayName ?? b?.provider?.name ?? '—',
            rating: b?.provider?.rating ?? 0,
            reviews: b?.provider?.reviewCount ?? b?.provider?.reviews ?? 0,
          },
        };
      });
      setBookings(list);
    } catch {
      setError('Could not load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(true);
  }, [fetchBookings]);

  const insets = useSafeAreaInsets();
  const completed = bookings.filter(b => b.status === 'completed').length;
  const totalSpent = bookings
    .filter(b => b.status === 'completed' && b.totalPrice)
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const active = bookings.filter(b => ['confirmed', 'en_route', 'in_progress', 'pending'].includes(b.status)).length;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        {active > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{active} active</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBookings()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{bookings.length}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMid]}>
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statLabel}>COMPLETED</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {totalSpent > 0 ? `Rs. ${(totalSpent / 1000).toFixed(1)}k` : '—'}
              </Text>
              <Text style={styles.statLabel}>SPENT</Text>
            </View>
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyDesc}>Your confirmed service requests will appear here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {bookings.map((booking) => {
                const sc = STATUS_CONFIG[booking.status] ?? { label: booking.status, bg: '#F5F5F5', color: '#999' };
                const isActive = ['confirmed', 'en_route', 'in_progress'].includes(booking.status);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.card, isActive && styles.cardActive]}
                    onPress={() => isActive && navigation.navigate('ActiveBooking', { bookingId: booking.id })}
                    activeOpacity={isActive ? 0.7 : 1}
                  >
                    {isActive && <View style={styles.activeStripe} />}

                    <View style={styles.cardTop}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{booking.provider?.name?.[0] ?? '?'}</Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.providerName}>{booking.provider?.name ?? '—'}</Text>
                        <Text style={styles.serviceText}>{booking.service ?? 'Service'}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>DATE</Text>
                        <Text style={styles.metaValue}>{formatDate(booking.scheduledAt)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>TIME</Text>
                        <Text style={styles.metaValue}>{formatTime(booking.scheduledAt)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>PRICE</Text>
                        <Text style={styles.metaValue}>
                          {booking.totalPrice ? `Rs. ${booking.totalPrice.toLocaleString()}` : '—'}
                        </Text>
                      </View>
                    </View>

                    {isActive && (
                      <View style={styles.trackRow}>
                        <Text style={styles.trackText}>Track booking →</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

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
  activeBadge: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { color: Colors.muted, fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 32 },
  errorText: { fontSize: 15, color: Colors.muted, textAlign: 'center' },
  retryBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statCardMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F0F0F0',
  },
  statValue: { fontSize: 20, fontFamily: Fonts.latin.bold, color: Colors.text },
  statLabel: { fontSize: 9, fontWeight: '800', color: Colors.muted, letterSpacing: 0.8, marginTop: 3 },

  emptyWrap: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.latin.bold, color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 },

  list: { paddingHorizontal: Spacing.lg, gap: 12 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardActive: { borderColor: Colors.primary + '40' },
  activeStripe: { height: 3, backgroundColor: Colors.primary },

  cardTop: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardInfo: { flex: 1 },
  providerName: { fontSize: 15, fontFamily: Fonts.latin.bold, color: Colors.text },
  serviceText: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 10, fontWeight: '800' },

  cardMeta: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 9, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 3 },
  metaValue: { fontSize: 12, fontWeight: '600', color: Colors.text },

  trackRow: {
    backgroundColor: Colors.primary + '08',
    paddingVertical: 10,
    alignItems: 'center',
  },
  trackText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
