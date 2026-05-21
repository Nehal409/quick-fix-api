import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import type { Booking } from '../../types';

interface BookingConfirmCardProps {
  booking: Booking;
  onTrack: () => void;
  onCalendar?: () => void;
}

export function BookingConfirmCard({ booking, onTrack, onCalendar }: BookingConfirmCardProps) {
  const details = [
    { label: 'WHEN', value: booking.scheduledAt, icon: '📅' },
    { label: 'WHERE', value: booking.address ?? 'Street 24, G-13/3, Islamabad', icon: '📍', note: '2.7km from provider' },
    { label: 'SERVICE', value: booking.service ?? 'AC repair · Inverter unit', icon: '🔧' },
    { label: 'TOTAL', value: `Rs. ${booking.totalPrice.toLocaleString()} · cash after service`, icon: '💰' },
    { label: 'BOOKING ID', value: booking.id, icon: '🆔' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.successHeader}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.bookedLabel}>BOOKING CONFIRMED</Text>
        <Text style={styles.successTitle}>
          You're booked for{'\n'}
          <Text style={styles.timeHighlight}>{booking.scheduledAt.split(' - ')[0]}</Text>
        </Text>
      </View>

      <View style={styles.providerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{booking.provider.name[0]}</Text>
        </View>
        <View style={styles.providerText}>
          <Text style={styles.providerName}>{booking.provider.name}</Text>
          <Text style={styles.providerMeta}>★ {booking.provider.rating}  ·  {booking.provider.reviews} reviews</Text>
        </View>
        <TouchableOpacity style={styles.msgBtn}>
          <Text style={styles.msgIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsList}>
        {details.map((d, i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailIcon}>{d.icon}</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
              {d.note && <Text style={styles.detailNote}>{d.note}</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.whatsappBox}>
        <View style={styles.whatsappBadge}>
          <Text style={styles.whatsappBadgeText}>✦ SIMULATED WHATSAPP</Text>
        </View>
        <Text style={styles.whatsappText}>
          <Text style={styles.bold}>Quickfix:</Text> Booking confirmed with {booking.provider.name} for {booking.scheduledAt.split(' - ')[0]}. Reminder will be sent 1 hour before. Reply CANCEL to cancel.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onCalendar}>
          <Text style={styles.secondaryBtnText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onTrack}>
          <Text style={styles.primaryBtnText}>Track booking</Text>
        </TouchableOpacity>
      </View>
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
  successHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  checkIcon: {
    fontSize: 30,
    color: Colors.success,
    fontWeight: 'bold',
  },
  bookedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  timeHighlight: {
    color: '#D94027',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  providerText: {
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
  msgBtn: {
    padding: 8,
  },
  msgIcon: {
    fontSize: 20,
  },
  detailsList: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: Fonts.latin.medium,
    color: Colors.text,
  },
  detailNote: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  whatsappBox: {
    backgroundColor: '#E7F5E9',
    padding: 16,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  whatsappBadge: {
    backgroundColor: '#34A85320',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  whatsappBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  whatsappText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
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
    flex: 1,
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
