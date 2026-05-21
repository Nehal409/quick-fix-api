import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Radius, Fonts } from '../../theme';

const ACCENT = '#C1440E';
const CREAM = '#F5F0EB';

type Tag = { label: string; style: 'urgent' | 'routine' | 'default' };

type Request = {
  id: string;
  initials: string;
  name: string;
  service: string;
  tags: Tag[];
  when: string;
  where: string;
  payout: string;
  matchScore: number;
  urgent?: boolean;
  timer?: string;
};

const REQUESTS: Request[] = [
  {
    id: '1',
    initials: 'H',
    name: 'Hassan Iqbal',
    service: 'AC repair · inverter',
    tags: [{ label: 'URGENT', style: 'urgent' }, { label: 'WITHIN 24H', style: 'default' }],
    when: 'Tomorrow · 10:00 AM',
    where: 'G-13/3 · 2.3 km',
    payout: 'Rs. 3,200',
    matchScore: 92,
    urgent: true,
    timer: '0:17',
  },
  {
    id: '2',
    initials: 'S',
    name: 'Saira A.',
    service: 'AC service · annual',
    tags: [{ label: 'ROUTINE', style: 'routine' }],
    when: 'Today · 4:00 PM',
    where: 'F-11 · 4.2 km',
    payout: 'Rs. 1,800',
    matchScore: 81,
  },
  {
    id: '3',
    initials: 'M',
    name: 'Mehdi K.',
    service: 'AC install · split',
    tags: [{ label: 'HIGH-VALUE', style: 'default' }, { label: 'COMPLEX', style: 'default' }],
    when: 'Thu · 11:00 AM',
    where: 'I-8 · 6.4 km',
    payout: 'Rs. 6,500',
    matchScore: 74,
  },
];

function Tag({ tag }: { tag: Tag }) {
  return (
    <View style={[styles.tag, tag.style === 'urgent' && styles.tagUrgent, tag.style === 'routine' && styles.tagRoutine]}>
      <Text style={[styles.tagText, tag.style === 'urgent' && styles.tagTextUrgent]}>{tag.label}</Text>
    </View>
  );
}

function RequestCard({ req, onAccept, onDecline, accepted, declined }: {
  req: Request;
  onAccept: () => void;
  onDecline: () => void;
  accepted: boolean;
  declined: boolean;
}) {
  if (declined) return null;

  return (
    <View style={[styles.card, req.urgent && styles.cardUrgent]}>
      {req.urgent && (
        <View style={styles.urgentHeader}>
          <Text style={styles.urgentLabel}>URGENT · BEST MATCH FOR YOU</Text>
          {req.timer && <Text style={styles.urgentTimer}>{req.timer}</Text>}
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Avatar + info */}
        <View style={styles.cardTop}>
          <View style={[styles.avatar, req.urgent && styles.avatarUrgent]}>
            <Text style={styles.avatarText}>{req.initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.customerName}>{req.name}</Text>
            <Text style={styles.serviceText}>{req.service}</Text>
            <View style={styles.tagRow}>
              {req.tags.map((t, i) => <Tag key={i} tag={t} />)}
            </View>
          </View>
          <View style={styles.matchWrap}>
            <Text style={styles.matchLabel}>YOUR MATCH</Text>
            <Text style={[styles.matchScore, req.urgent && styles.matchScoreUrgent]}>{req.matchScore}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🗓</Text>
            <View>
              <Text style={styles.metaLabel}>WHEN</Text>
              <Text style={styles.metaValue}>{req.when}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <View>
              <Text style={styles.metaLabel}>WHERE</Text>
              <Text style={styles.metaValue}>{req.where}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💳</Text>
            <View>
              <Text style={styles.metaLabel}>PAYOUT</Text>
              <Text style={styles.metaValue}>{req.payout}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        {!accepted ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, req.urgent && styles.acceptBtnUrgent]}
              onPress={onAccept}
            >
              <Text style={styles.acceptBtnText}>Accept ✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.acceptedBar}>
            <Text style={styles.acceptedText}>✓ Accepted</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ProviderInboxScreen() {
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(true);
  const [states, setStates] = useState<Record<string, 'idle' | 'accepted' | 'declined'>>({
    '1': 'idle', '2': 'idle', '3': 'idle',
  });

  const set = (id: string, val: 'accepted' | 'declined') =>
    setStates(prev => ({ ...prev, [id]: val }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Requests</Text>
          <Text style={styles.headerSub}>3 new · 1 urgent</Text>
        </View>
        <TouchableOpacity style={[styles.onlineBadge, !online && styles.onlineBadgeOff]} onPress={() => setOnline(o => !o)}>
          <View style={[styles.onlineDot, !online && styles.onlineDotOff]} />
          <Text style={[styles.onlineText, !online && styles.onlineTextOff]}>{online ? 'Online' : 'Offline'}</Text>
        </TouchableOpacity>
      </View>

      {/* Surge banner */}
      {online && (
        <View style={styles.surgeBanner}>
          <Text style={styles.surgeIcon}>🔥</Text>
          <Text style={styles.surgeText}>
            <Text style={styles.surgeBold}>Demand surge near you</Text> · Heatwave alert. Accepting now earns 1.1× surge.
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Text style={styles.sectionLabel}>INCOMING</Text>
        {REQUESTS.map(req => (
          <RequestCard
            key={req.id}
            req={req}
            accepted={states[req.id] === 'accepted'}
            declined={states[req.id] === 'declined'}
            onAccept={() => set(req.id, 'accepted')}
            onDecline={() => set(req.id, 'declined')}
          />
        ))}
        {REQUESTS.every(r => states[r.id] !== 'idle') && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: CREAM,
  },
  headerTitle: { fontSize: 24, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  onlineBadgeOff: { backgroundColor: '#F5F5F5' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E7D32' },
  onlineDotOff: { backgroundColor: '#999' },
  onlineText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  onlineTextOff: { color: '#999' },

  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  surgeIcon: { fontSize: 16 },
  surgeText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 17 },
  surgeBold: { fontWeight: '700', color: '#1A1A1A' },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardUrgent: { borderWidth: 1.5, borderColor: ACCENT + '60' },

  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  urgentLabel: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  urgentTimer: { fontSize: 13, fontWeight: '700', color: '#fff' },

  cardBody: { padding: Spacing.md },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarUrgent: { backgroundColor: ACCENT + '20' },
  avatarText: { fontSize: 18, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  cardInfo: { flex: 1 },
  customerName: { fontSize: 15, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  serviceText: { fontSize: 12, color: '#666', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },

  tag: {
    backgroundColor: '#F0ECE8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagUrgent: { backgroundColor: '#FFEBEE' },
  tagRoutine: { backgroundColor: '#E8F5E9' },
  tagText: { fontSize: 9, fontWeight: '800', color: '#666', letterSpacing: 0.5 },
  tagTextUrgent: { color: '#C62828' },

  matchWrap: { alignItems: 'flex-end' },
  matchLabel: { fontSize: 9, fontWeight: '700', color: '#999', letterSpacing: 0.5 },
  matchScore: { fontSize: 26, fontFamily: Fonts.latin.bold, color: '#1A1A1A' },
  matchScoreUrgent: { color: ACCENT },

  metaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE8',
    paddingTop: 10,
    marginBottom: 12,
    gap: 4,
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  metaIcon: { fontSize: 11, marginTop: 2 },
  metaLabel: { fontSize: 9, fontWeight: '700', color: '#999', letterSpacing: 0.3, marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', lineHeight: 15 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  declineBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#D0C8C0',
    alignItems: 'center',
  },
  declineBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  acceptBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  acceptBtnUrgent: { backgroundColor: ACCENT },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  acceptedBar: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptedText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#999' },
});
