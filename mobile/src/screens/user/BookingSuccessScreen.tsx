import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BookingConfirmCard } from '../../components/chat/BookingConfirmCard';
import { Colors, Spacing } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'BookingSuccess'>;

export function BookingSuccessScreen({ route, navigation }: Props) {
  const { booking } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BookingConfirmCard
        booking={booking}
        onTrack={() => navigation.replace('ActiveBooking', { bookingId: booking.id })}
        onCalendar={() => navigation.goBack()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
});
