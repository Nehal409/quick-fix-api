import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import { TrackingTimeline, TimelineStep } from '../../components/booking/TrackingTimeline';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'ActiveBooking'>;

const MOCK_STEPS: TimelineStep[] = [
  { id: '1', label: 'Booking confirmed', time: '9:38 AM yesterday', status: 'completed' },
  { id: '2', label: 'Reminder sent · 1 hr before', time: '9:00 AM', status: 'completed', log: 'Simulated WhatsApp ✓' },
  { 
    id: '3', 
    label: 'Provider en route', 
    time: '9:43 AM - now', 
    status: 'active', 
    eta: '17 min',
    log: 'followup_agent ->\neta_recalc(traffic_factor=1.12)' 
  },
  { id: '4', label: 'Service in progress', time: 'Expected 10:00 AM', status: 'pending' },
  { id: '5', label: 'Completion + feedback', time: 'Expected 11:00 AM', status: 'pending' },
];

export function ActiveBookingScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Booking · QF-2086</Text>
          <Text style={styles.headerSub}>In progress</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Mock Map View */}
        <View style={styles.mapMock}>
          <View style={styles.mapBg}>
             {/* Polyline representation */}
             <View style={styles.polyline} />
             <View style={[styles.mapPoint, { left: '20%', top: '70%', backgroundColor: '#FFFFFF' }]}>
               <View style={[styles.innerPoint, { backgroundColor: '#D94027' }]} />
             </View>
             <View style={[styles.mapPoint, { right: '20%', top: '30%', backgroundColor: '#D94027' }]}>
               <Text style={styles.pointText}>A</Text>
             </View>
             
             <View style={styles.etaBadge}>
                <Text style={styles.etaBadgeText}>ETA <Text style={styles.boldText}>17 MIN</Text></Text>
             </View>
          </View>
          <Text style={styles.mapLabel}>STATIC MAP · DEMO</Text>
        </View>

        <View style={styles.content}>
          {/* Provider Card */}
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
               <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Ali Khan</Text>
              <Text style={styles.providerMeta}>Toyota Aqua · BFG-7821 · 4.8★</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.btnIcon}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.callBtn]}>
                <Text style={[styles.btnIcon, { color: '#FFFFFF' }]}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>STATUS</Text>
          <TrackingTimeline steps={MOCK_STEPS} />
        </View>
      </ScrollView>

      {/* Bottom Sticky Card */}
      <View style={styles.stickyFooter}>
        <View style={styles.etaContainer}>
          <Text style={styles.arrivingLabel}>ARRIVING IN</Text>
          <Text style={styles.etaBig}>17 <Text style={styles.etaUnit}>MIN</Text></Text>
        </View>
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => navigation.navigate('AutoReschedule', { bookingId })}
        >
          <Text style={styles.cancelText}>Cancel</Text>
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
  mapMock: {
    height: 220,
    position: 'relative',
  },
  mapBg: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    margin: Spacing.md,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  polyline: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    width: '50%',
    height: 80,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#D94027',
    borderBottomRightRadius: 40,
    opacity: 0.6,
  },
  mapPoint: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  innerPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  etaBadgeText: {
    fontSize: 10,
    color: '#D94027',
  },
  boldText: {
    fontWeight: 'bold',
  },
  mapLabel: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    fontSize: 9,
    color: '#999',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.md,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF2F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D94027',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  providerMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  callBtn: {
    backgroundColor: '#D94027',
    borderColor: '#D94027',
  },
  btnIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  stickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -5 } },
      android: { elevation: 10 },
    }),
  },
  etaContainer: {
    flex: 1,
  },
  arrivingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  etaBig: {
    fontSize: 24,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
    marginTop: 2,
  },
  etaUnit: {
    fontSize: 14,
    color: Colors.muted,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  cancelText: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 14,
  },
});
