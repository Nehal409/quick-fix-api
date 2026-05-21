import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams, UserTabParams } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParams, 'Bookings'>,
  NativeStackScreenProps<RootStackParams>
>;

export function BookingHistoryScreen({ navigation }: Props) {
  const stats = [
    { label: 'BOOKINGS', value: '12', sub: 'this year' },
    { label: 'SPENT', value: 'Rs. 21k', sub: 'on AC services' },
    { label: 'SAVED', value: 'Rs. 3.4k', sub: 'vs market' },
  ];

  const recentItems = [
    { 
      id: '1', 
      name: 'Bilal AC Repair', 
      service: 'AC repair · Inverter', 
      status: 'Completed', 
      time: '10:14 AM', 
      idCode: 'QF-2020', 
      price: 'Rs. 3,200',
      statusColor: '#E8F5E9',
      textColor: '#2E7D32'
    },
    { 
      id: '2', 
      name: 'Ali Khan AC Services', 
      service: 'AC repair · Inverter', 
      status: 'Rescheduled', 
      time: '9:30 AM', 
      idCode: 'QF-2086 orig', 
      price: '—',
      statusColor: '#FFF8E1',
      textColor: '#FBC02D',
      note: 'Auto-rescheduled to Bilal'
    },
    { 
      id: '3', 
      name: 'Kaif Cooling Co.', 
      service: 'AC service · annual', 
      status: 'Completed', 
      time: '3:00 PM', 
      idCode: 'QF-1944', 
      price: 'Rs. 1,888',
      statusColor: '#E8F5E9',
      textColor: '#2E7D32'
    },
    { 
      id: '4', 
      name: 'Hamza Tech', 
      service: 'AC repair · noise', 
      status: 'In dispute', 
      time: '11:00 AM', 
      idCode: 'QF-1823', 
      price: 'Rs. 2,400',
      statusColor: '#FFEBEE',
      textColor: '#D32F2F'
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity>
           <Icon name="magnify" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>RECENT</Text>

        <View style={styles.list}>
          {recentItems.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => navigation.navigate('Dispute', { bookingId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={styles.flex1}>
                   <Text style={styles.name}>{item.name}</Text>
                   <Text style={styles.service}>{item.service}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                  <Text style={[styles.statusText, { color: item.textColor }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerCol}>
                  <Text style={styles.footerLabel}>TODAY · {item.time} · {item.idCode}</Text>
                  {item.note && (
                    <Text style={styles.noteLine}>✦ {item.note}</Text>
                  )}
                </View>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  container: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  statSub: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.muted,
  },
  flex1: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  service: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F9F9F9',
    paddingTop: 12,
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  noteLine: {
    fontSize: 11,
    color: '#D94027',
    marginTop: 4,
    fontWeight: '700',
  },
  price: {
    fontSize: 14,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
});
