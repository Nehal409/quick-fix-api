import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';

interface AutoRescheduleCardProps {
  oldProvider: {
    name: string;
    reason: string;
  };
  newProvider: {
    name: string;
    rating: number;
    reviews: number;
    distance: string;
    price: string;
    eta: string;
  };
  timeElapsed: string;
}

export function AutoRescheduleCard({ oldProvider, newProvider, timeElapsed }: AutoRescheduleCardProps) {
  return (
    <View style={styles.container}>
      {/* Old Provider Cancelled */}
      <View style={styles.cancelledBox}>
        <View style={styles.providerMini}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{oldProvider.name[0]}</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.oldName}>{oldProvider.name}</Text>
            <Text style={styles.reason}>Reason: "{oldProvider.reason}"</Text>
          </View>
          <Text style={styles.cancelledBadge}>CANCELLED</Text>
        </View>
      </View>

      {/* Arrow Down */}
      <View style={styles.arrowContainer}>
        <View style={styles.arrowBg}>
          <Text style={styles.arrowIcon}>↓</Text>
        </View>
      </View>

      {/* New Provider Rescheduled */}
      <View style={styles.newBox}>
        <View style={styles.rescheduleHeader}>
          <Text style={styles.rescheduleTitle}>✦ RESCHEDULED IN {timeElapsed}S</Text>
        </View>
        
        <View style={styles.providerMain}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{newProvider.name[0]}</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.newName}>{newProvider.name}</Text>
            <Text style={styles.newMeta}>★ {newProvider.rating}  ·  {newProvider.reviews} km  ·  same slot</Text>
          </View>
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>WHEN</Text>
            <Text style={styles.statValue}>10:00 AM</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PRICE</Text>
            <Text style={styles.statValue}>{newProvider.price}</Text>
            <Text style={styles.sameText}>same ✓</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{newProvider.eta}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  cancelledBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    opacity: 0.7,
  },
  providerMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.muted,
  },
  flex1: {
    flex: 1,
  },
  oldName: {
    fontSize: 13,
    fontFamily: Fonts.latin.bold,
    color: Colors.muted,
  },
  reason: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cancelledBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D32F2F',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 2,
  },
  arrowBg: {
    backgroundColor: '#1C1C1C',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: '#D94027',
    overflow: 'hidden',
    padding: 16,
  },
  rescheduleHeader: {
    marginBottom: 12,
  },
  rescheduleTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D94027',
    letterSpacing: 1,
  },
  providerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  newName: {
    fontSize: 16,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  newMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  availableText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
    padding: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  sameText: {
    fontSize: 9,
    color: Colors.success,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
