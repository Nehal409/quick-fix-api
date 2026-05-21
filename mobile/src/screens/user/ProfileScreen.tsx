import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { usersApi, bookingsApi } from '../../lib/api';
import type { Booking } from '../../types';

type MenuRow = {
  icon: string;
  label: string;
  sub?: string;
  danger?: boolean;
  onPress?: () => void;
};

function MenuItem({ icon, label, sub, danger, onPress }: MenuRow) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuLabelWrap}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {!danger && <Text style={styles.menuChevron}>›</Text>}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [displayEmail, setDisplayEmail] = useState(user?.email ?? '');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<{ bookingsThisYear: number; totalSpent: number; savingsVsMarket: number } | null>(null);

  useEffect(() => {
    usersApi.me()
      .then(({ data: raw }) => {
        const profile = (raw as any)?.id ? raw : ((raw as any)?.data ?? raw);
        setDisplayName(profile?.name ?? user?.name ?? '');
        setDisplayEmail(profile?.email ?? user?.email ?? '');
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));

    bookingsApi.list()
      .then(({ data: raw }) => {
        const inner = (raw as any)?.data ?? raw;
        const list: Booking[] = inner?.bookings ?? (Array.isArray(inner) ? inner : []);
        setBookings(list);
        if (inner?.summary) setSummary(inner.summary);
      })
      .catch(() => {});
  }, [user]);

  const completedBookings = summary?.bookingsThisYear ?? bookings.filter(b => b.status === 'completed').length;
  const totalSpent = summary?.totalSpent ?? bookings.filter(b => b.status === 'completed' && b.totalPrice).reduce((sum, b) => sum + b.totalPrice, 0);
  const savedCount = summary?.savingsVsMarket ?? bookings.filter(b => b.status === 'cancelled').length;

  const initials = (displayName || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sections: { title?: string; rows: MenuRow[] }[] = [
    {
      title: 'Account',
      rows: [
        { icon: '👤', label: 'Personal info', sub: user?.email ?? '' },
        { icon: '🔒', label: 'Change password' },
        { icon: '📍', label: 'Saved addresses' },
      ],
    },
    
    {
      rows: [
        { icon: '🚪', label: 'Log out', danger: true, onPress: clearAuth },
      ],
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Hero card */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {profileLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.avatarText}>{initials}</Text>
              }
            </View>
          </View>
          <Text style={styles.heroName}>{displayName || 'User'}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{user?.role === 'provider' ? '🔧 Provider' : '👤 Customer'}</Text>
          </View>
        </View>

        {/* Menu sections */}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>}
            <View style={styles.sectionCard}>
              {section.rows.map((row, ri) => (
                <View key={ri}>
                  {ri > 0 && <View style={styles.divider} />}
                  <MenuItem {...row} />
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Quickfix v1.0 · Built with ❤️ in Karachi</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontFamily: Fonts.latin.bold, color: Colors.text },
  heroEmail: { fontSize: 13, color: Colors.muted, marginTop: 3 },
  heroBadge: {
    marginTop: 10,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
  statValue: { fontSize: 18, fontFamily: Fonts.latin.bold, color: Colors.text },
  statLabel: { fontSize: 9, fontWeight: '800', color: Colors.muted, letterSpacing: 0.8, marginTop: 3 },

  section: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 56 },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuIconDanger: { backgroundColor: Colors.danger + '12' },
  menuIconText: { fontSize: 18 },
  menuLabelWrap: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  menuLabelDanger: { color: Colors.danger, fontWeight: '600' },
  menuSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  menuChevron: { fontSize: 20, color: '#C0C0C0', marginLeft: 4 },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.muted,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
