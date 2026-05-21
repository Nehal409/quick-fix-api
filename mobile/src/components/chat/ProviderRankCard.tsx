import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { Candidate, IntentData } from '../../types';

interface ProviderRankCardProps {
  requestId: string;
  candidates: Candidate[];
  intent: IntentData;
  onSelect: (requestId: string, candidate: Candidate, intent: IntentData) => void;
  onShowReasoning?: (candidate: Candidate) => void;
}

export function ProviderRankCard({
  requestId,
  candidates,
  intent,
  onSelect,
  onShowReasoning,
}: ProviderRankCardProps) {
  return (
    <View style={styles.card}>
      {/* Agent Trace Badge */}
      <View style={styles.agentTraceBadge}>
        <Text style={styles.agentTraceText}>✦ AGENT TRACE</Text>
        <Text style={styles.agentTraceDetail}>
          Scanned 12 providers near {intent.location.sector}. Filtered to 6 with AC specialization. Ranked by 8 factors — distance was 3rd most weighted.
        </Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{candidates.length} matches found</Text>
        <Text style={styles.subTitle}>Ranked by 8 factors · 2.1 sec</Text>
      </View>

      {candidates.map((candidate, index) => {
        const isBestMatch = candidate.isBestMatch || index === 0;
        return (
          <View key={candidate.providerId} style={[styles.providerContainer, index > 0 && styles.borderTop]}>
            {isBestMatch && (
              <View style={styles.bestMatchBadge}>
                <Text style={styles.bestMatchText}>BEST MATCH</Text>
              </View>
            )}

            <View style={styles.providerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{candidate.displayName[0]}</Text>
              </View>
              <View style={styles.providerMainInfo}>
                <Text style={styles.providerName}>{candidate.displayName}</Text>
                {candidate.tag && (
                  <View style={styles.tagRow}>
                    <Text style={styles.tag}>{candidate.tag.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.scoreContainer}>
                {!isBestMatch && <Text style={styles.scoreLabel}>MATCH</Text>}
                <Text style={[styles.scoreValue, isBestMatch && styles.scoreBest]}>{candidate.matchScore}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>{candidate.distance}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ETA</Text>
                <Text style={styles.statValue}>{candidate.eta}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>PRICE</Text>
                <Text style={styles.statValue}>{candidate.priceEstimate}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.reasoningBtn}
                onPress={() => onShowReasoning?.(candidate)}
              >
                <Text style={styles.reasoningBtnText}>⌄ How I decided</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectBtn, !isBestMatch && styles.viewBtn]}
                onPress={() => onSelect(requestId, candidate, intent)}
              >
                <Text style={[styles.selectBtnText, !isBestMatch && styles.viewBtnText]}>
                  {isBestMatch ? 'Select' : 'View'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  agentTraceBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: Spacing.md,
  },
  agentTraceText: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  agentTraceDetail: {
    color: '#E0E0E0',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  providerContainer: {
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bestMatchBadge: {
    position: 'absolute',
    top: 6,
    right: 0,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestMatchText: {
    color: '#D32F2F',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  providerMainInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewText: {
    fontSize: 12,
    color: Colors.muted,
    marginLeft: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
    marginTop: 10,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  scoreBest: {
    color: '#D32F2F',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasoningBtn: {
    paddingVertical: 4,
  },
  reasoningBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  selectBtn: {
    backgroundColor: '#D94027',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  viewBtnText: {
    color: Colors.text,
  },
});
