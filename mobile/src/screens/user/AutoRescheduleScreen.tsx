import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { AutoRescheduleCard } from '../../components/booking/AutoRescheduleCard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'AutoReschedule'>;

export function AutoRescheduleScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Booking · QF-2086</Text>
          <Text style={styles.headerSub}>Recovery active</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertText}>Provider cancelled · auto-rescheduling</Text>
        </View>

        <View style={styles.content}>
          <AutoRescheduleCard
            oldProvider={{
              name: 'Ali Khan',
              reason: 'emergency at home',
            }}
            newProvider={{
              name: 'Bilal AC Repair',
              rating: 4.6,
              reviews: 2.3,
              distance: '2.3 km',
              price: 'Rs. 3,200',
              eta: '21 min',
            }}
            timeElapsed="3.2"
          />

          <View style={styles.traceBox}>
            <Text style={styles.traceTitle}>WHAT I DID</Text>
            <View style={styles.traceContent}>
              <Text style={styles.traceLine}>✓ observed: provider_cancel(ali, reason="emergency")</Text>
              <Text style={styles.traceLine}>✓ excluded ali from candidate pool</Text>
              <Text style={styles.traceLine}>✓ re-ranked 7 providers · top: bilal (84)</Text>
              <Text style={styles.traceLine}>✓ checked bilal.availability(10:00 AM) → free</Text>
              <Text style={styles.traceLine}>✓ auto-booked · sent confirmation</Text>
              <Text style={styles.traceFooter}>elapsed 3.2s  ·  4 tool calls  ·  1 LLM call</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryBtnText}>Pick someone else</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Feedback', { bookingId, providerId: '2' })}
        >
          <Text style={styles.primaryBtnText}>Keep new booking ✓</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.muted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  container: {
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    margin: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  alertIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  alertText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  traceBox: {
    marginTop: Spacing.lg,
  },
  traceTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  traceContent: {
    backgroundColor: '#1C1C1C',
    borderRadius: Radius.card,
    padding: 16,
  },
  traceLine: {
    color: '#D4D4D4',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
    lineHeight: 18,
  },
  traceFooter: {
    color: '#666666',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
  },
  stickyFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F3F4',
    paddingVertical: 14,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: Colors.text,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
