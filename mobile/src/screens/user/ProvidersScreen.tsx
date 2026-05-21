import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { bookingsApi } from '../../lib/api';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { Candidate } from '../../types';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'Providers'>;
type Nav = NativeStackNavigationProp<RootStackParams>;

export function ProvidersScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const insets = useSafeAreaInsets();
  const { requestId, candidates, intent } = route.params;

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBook = async (candidate: Candidate) => {
    if (loading) return;
    setBookingId(candidate.providerId);
    setLoading(true);
    try {
      const payload: { requestId: string; providerId: string; scheduledAt?: string } = {
        requestId,
        providerId: candidate.providerId,
      };
      if (intent.when?.start) {
        payload.scheduledAt = intent.when.start;
      }
      const { data } = await bookingsApi.create(payload);
      navigation.replace('BookingSuccess', { booking: data });
    } catch (err: any) {
      setLoading(false);
      setBookingId(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Matches found</Text>
          <Text style={styles.headerSub}>{candidates.length} providers · Ranked by 8 factors</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Agent trace */}
        <View style={styles.agentTraceBadge}>
          <Text style={styles.agentTraceLabel}>✦ AGENT TRACE</Text>
          <Text style={styles.agentTraceText}>
            Scanned providers near {intent.location?.sector ?? 'your area'}. Filtered by {intent.service?.label ?? 'service'} specialization. Ranked by 8 factors — distance, rating, price & availability.
          </Text>
        </View>

        {candidates.map((candidate, index) => {
          const isBest = candidate.isBestMatch || index === 0;
          const isBookingThis = bookingId === candidate.providerId && loading;

          return (
            <View key={candidate.providerId} style={[styles.card, isBest && styles.cardBest]}>
              {isBest && (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>BEST MATCH</Text>
                </View>
              )}

              {/* Provider header */}
              <View style={styles.providerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{candidate.displayName[0]}</Text>
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{candidate.displayName}</Text>
                  {candidate.tag && (
                    <View style={styles.tagRow}>
                      <Text style={styles.tag}>{candidate.tag.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>{isBest ? '' : 'MATCH'}</Text>
                  <Text style={[styles.scoreValue, isBest && styles.scoreBest]}>
                    {candidate.matchScore}
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>DISTANCE</Text>
                  <Text style={styles.statValue}>{candidate.distance}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>ETA</Text>
                  <Text style={styles.statValue}>{candidate.eta}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PRICE</Text>
                  <Text style={styles.statValue}>{candidate.priceEstimate}</Text>
                </View>
              </View>

              {/* Book button */}
              <TouchableOpacity
                style={[styles.bookBtn, isBest && styles.bookBtnBest, isBookingThis && styles.bookBtnLoading]}
                onPress={() => handleBook(candidate)}
                disabled={loading}
              >
                {isBookingThis ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.bookBtnText}>Book for {candidate.priceEstimate} →</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: Colors.text, lineHeight: 22 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },

  list: { padding: Spacing.md, gap: 14 },

  agentTraceBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 4,
  },
  agentTraceLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  agentTraceText: {
    color: '#E0E0E0',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBest: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },

  bestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  bestBadgeText: {
    color: '#D32F2F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tagRow: { flexDirection: 'row', marginTop: 4 },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreBox: { alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 2 },
  scoreValue: { fontSize: 26, fontWeight: '800', color: Colors.text },
  scoreBest: { color: '#D32F2F' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#E0E0E0' },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: 3 },
  statValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  bookBtn: {
    backgroundColor: Colors.text,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  bookBtnBest: { backgroundColor: '#D94027' },
  bookBtnLoading: { opacity: 0.7 },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
