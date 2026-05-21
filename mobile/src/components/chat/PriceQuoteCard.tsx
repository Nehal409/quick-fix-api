import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { Candidate } from '../../types';

interface PriceLine {
  label: string;
  detail: string;
  amount: number;
  isNegative?: boolean;
}

interface PriceQuoteCardProps {
  candidate: Candidate;
  budgetCap: number | null;
  onBook: () => void;
}

export function PriceQuoteCard({ candidate, budgetCap, onBook }: PriceQuoteCardProps) {
  const breakdown: PriceLine[] = [
    { label: 'Visit fee', detail: 'Diagnostic + first 30 min', amount: 1500 },
    { label: 'Travel cost', detail: `${candidate.distance} x Rs. 50/km`, amount: 135 },
    { label: 'Service complexity', detail: 'Inverter unit - intermediate', amount: 1200 },
    { label: 'Urgency adjustment', detail: 'Next-morning slot < 12h', amount: 285 },
    { label: 'Loyalty discount', detail: 'Returning customer - 2%', amount: 60, isNegative: true },
    { label: 'Demand surge', detail: 'Heatwave alert: Islamabad', amount: 140 },
  ];

  const total = breakdown.reduce((acc, curr) => acc + (curr.isNegative ? -curr.amount : curr.amount), 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.quoteLabel}>Quote</Text>
        <Text style={styles.stepCount}>Step 3 of 4</Text>
      </View>

      <Text style={styles.priceAmount}>Rs. {total.toLocaleString()}</Text>
      <Text style={styles.budgetNote}>
        {budgetCap ? `Under your Rs. ${budgetCap.toLocaleString()} cap. ` : ''}Final amount fixed after diagnostic.
      </Text>

      <View style={styles.providerMiniCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{candidate.displayName[0]}</Text>
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{candidate.displayName}</Text>
          <Text style={styles.providerMeta}>Tomorrow · 10:00 AM · {candidate.distance} away</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{candidate.matchScore} match</Text>
        </View>
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>BREAKDOWN</Text>
        {breakdown.map((item, i) => (
          <View key={i} style={styles.breakdownRow}>
            <View style={styles.labelCol}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
            <Text style={[styles.itemAmount, item.isNegative && styles.negativeAmount]}>
              {item.isNegative ? '- ' : ''}Rs. {item.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimate</Text>
        <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
      </View>

      <View style={styles.fairnessContainer}>
        <Text style={styles.sectionTitle}>FAIRNESS</Text>
        <View style={styles.fairnessGraphic}>
          <View style={styles.fairnessRange}>
            <View style={styles.fairnessMarker} />
          </View>
          <View style={styles.fairnessLabels}>
            <Text style={styles.rangeText}>Rs. 2,800</Text>
            <Text style={styles.rangeText}>Rs. 3,700</Text>
          </View>
        </View>
        <View style={styles.fairnessInfo}>
          <Text style={styles.fairnessIndicator}>●</Text>
          <Text style={styles.fairnessText}>
            <Text style={styles.bold}>Fair for both.</Text> Provider keeps Rs. 2,560 - platform fee Rs. 640.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
        <Text style={styles.bookBtnText}>Book for Rs. {total.toLocaleString()}</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
  },
  stepCount: {
    fontSize: 10,
    color: Colors.muted,
  },
  priceAmount: {
    fontSize: 28,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  budgetNote: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  providerMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  providerMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D32F2F',
  },
  breakdownContainer: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  labelCol: {
    flex: 1,
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: Fonts.latin.medium,
    color: Colors.text,
  },
  itemDetail: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  negativeAmount: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  fairnessContainer: {
    marginBottom: Spacing.lg,
  },
  fairnessGraphic: {
    marginBottom: 10,
  },
  fairnessRange: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
    marginHorizontal: 10,
  },
  fairnessMarker: {
    position: 'absolute',
    left: '60%',
    top: -4,
    width: 2,
    height: 12,
    backgroundColor: Colors.success,
  },
  fairnessLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeText: {
    fontSize: 10,
    color: Colors.muted,
  },
  fairnessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F3',
    padding: 10,
    borderRadius: Radius.sm,
  },
  fairnessIndicator: {
    color: Colors.success,
    fontSize: 12,
    marginRight: 6,
  },
  fairnessText: {
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  bookBtn: {
    backgroundColor: Colors.text,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
