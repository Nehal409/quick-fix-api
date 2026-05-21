import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams, UserTabParams } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<UserTabParams, 'Notifications'>,
  NativeStackScreenProps<RootStackParams>
>;

export function NotificationsScreen({ navigation }: Props) {
  const notifications = [
    {
      group: 'NOW',
      items: [
        {
          id: '1',
          icon: 'map-marker',
          iconBg: '#FFF3E0',
          iconColor: '#E65100',
          title: 'Bilal is on his way',
          time: 'just now',
          desc: 'Auto-rescheduled from Ali (cancelled). Same time, same price.',
          action: 'View booking >',
          unread: true,
        }
      ]
    },
    {
      group: 'TODAY',
      items: [
        {
          id: '2',
          icon: 'whatsapp',
          iconBg: '#E8F5E9',
          iconColor: '#2E7D32',
          title: 'Confirmation sent - simulated WhatsApp',
          time: '2 hrs ago',
          desc: '"Your AC service is confirmed for tomorrow 10:00 AM. Reply CANCEL to cancel."',
          unread: true,
        },
        {
          id: '3',
          icon: 'receipt',
          iconBg: '#F5F5F5',
          iconColor: '#616161',
          title: 'Quote ready',
          time: '1 hr ago',
          desc: 'Rs. 3,200 — under your budget. Tap to review breakdown.',
        },
        {
          id: '4',
          icon: 'check-decagram',
          iconBg: '#FFF9C4',
          iconColor: '#FBC02D',
          title: 'Dispute resolved',
          time: '6 hrs ago',
          desc: 'Refund of Rs. 600 issued for QF-1789. Rating adjusted.',
        }
      ]
    },
    {
      group: 'EARLIER',
      items: [
        {
          id: '5',
          icon: 'star',
          iconBg: '#F5F5F5',
          iconColor: '#9E9E9E',
          title: 'Rate your last job',
          time: '9 hrs ago',
          desc: 'Hamza Tech completed an AC repair on Jun 27',
        },
        {
          id: '6',
          icon: 'clock-outline',
          iconBg: '#F5F5F5',
          iconColor: '#9E9E9E',
          title: 'Service starting soon',
          time: 'Aug 12',
          desc: 'Kaif Cooling arrives in 1 hour.',
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSub}>2 unread</Text>
        </View>
        <TouchableOpacity>
           <Icon name="magnify" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {notifications.map((group, gIndex) => (
          <View key={group.group} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.group}</Text>
            {group.items.map((item, iIndex) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.item}
                onPress={() => item.id === '1' && navigation.navigate('ActiveBooking', { bookingId: 'QF-2086' })}
              >
                <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                  <Icon name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <View style={styles.content}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, item.unread && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.itemTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
                  {('action' in item) && item.action && (
                    <Text style={styles.actionText}>{item.action as string}</Text>
                  )}
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.latin.bold,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  container: {
    flex: 1,
  },
  groupContainer: {
    paddingTop: 24,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  itemTime: {
    fontSize: 10,
    color: Colors.muted,
  },
  itemDesc: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  actionText: {
    fontSize: 12,
    color: '#D94027',
    fontWeight: '700',
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D94027',
    position: 'absolute',
    top: 24,
    right: 12,
  },
});
