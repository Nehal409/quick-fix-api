import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { Candidate } from '../../types';

interface ReasoningStep {
  label: string;
  detail: string;
  score: number; // e.g. +10 or -2
}

interface ReasoningPanelProps {
  candidate: Candidate;
  onContinue: (candidate: Candidate) => void;
  onClose: () => void;
}

export function ReasoningPanel({ candidate, onContinue, onClose }: ReasoningPanelProps) {
  // Mock reasoning steps based on Screen 06
  const factors: ReasoningStep[] = [
    { label: 'AC specialization match', detail: '"Inverter AC" in reviews x 3', score: 10 },
    { label: 'On-time score', detail: '96% over last 30 jobs', score: 12 },
    { label: 'Review recency (last 14d)', detail: '4 recent 5★ reviews', score: 6 },
    { label: 'Distance / travel time', detail: `${candidate.distance} · ${candidate.eta}`, score: 8 },
    { label: 'Capacity tomorrow morning', detail: '3 free slots in window', score: 5 },
    { label: 'Cancellation rate', detail: '1.2% (Low)', score: 4 },
    { label: 'Budget fit (Rs. 4,000 cap)', detail: `Quote ${candidate.priceEstimate}`, score: 3 },
    { label: 'Price per visit', detail: 'Slightly above peer median', score: -2 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{candidate.displayName[0]}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{candidate.displayName}</Text>
          <Text style={styles.subText}>Top candidates</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchScore}>{candidate.matchScore}</Text>
          <Text style={styles.matchLabel}>MATCH</Text>
        </View>
      </View>

      <Text style={styles.summary}>
        <Text style={styles.bold}>{candidate.displayName} is the best match</Text> based on specialization, on-time score, and distance from your location.
      </Text>

      <View style={styles.factorsSection}>
        <Text style={styles.sectionTitle}>FACTORS WEIGHED</Text>
        {factors.map((f, i) => (
          <View key={i} style={styles.factorRow}>
            <View style={styles.factorDotContainer}>
              <View style={styles.factorLine} />
              <View style={[styles.factorDot, { backgroundColor: f.score > 0 ? Colors.success : Colors.danger }]} />
            </View>
            <View style={styles.factorContent}>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <Text style={styles.factorDetail}>{f.detail}</Text>
            </View>
            <Text style={[styles.factorScore, { color: f.score > 0 ? Colors.success : Colors.danger }]}>
              {f.score > 0 ? `+${f.score}` : f.score}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.counterfactual}>
        <Text style={styles.counterTitle}>WHY NOT BILAL?</Text>
        <Text style={styles.counterText}>
          Bilal is 2.3km away (vs Ali's 2.7km) but has zero recorded experience with Inverter units. Quickfix policy prioritizes specialization for Inverter repairs.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => onContinue(candidate)}
      >
        <Text style={styles.primaryBtnText}>
          Continue with {candidate.displayName.split(' ')[0]} — {candidate.priceEstimate}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.card * 2,
    borderTopRightRadius: Radius.card * 2,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  subText: {
    fontSize: 12,
    color: Colors.muted,
  },
  matchBadge: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  matchScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D94027',
  },
  matchLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.muted,
  },
  summary: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
  },
  bold: {
    fontWeight: '700',
  },
  factorsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  factorDotContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 4,
  },
  factorLine: {
    position: 'absolute',
    top: 10,
    bottom: -16,
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  factorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  factorContent: {
    flex: 1,
  },
  factorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  factorDetail: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  factorScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterfactual: {
    backgroundColor: '#F1F3F4',
    padding: 16,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xl,
  },
  counterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  counterText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: Colors.text,
    borderRadius: Radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeBtnText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
