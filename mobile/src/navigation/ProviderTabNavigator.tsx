import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProviderHomeScreen } from '../screens/provider/ProviderHomeScreen';
import { ProviderJobsScreen } from '../screens/provider/ProviderJobsScreen';
import { ProviderInboxScreen } from '../screens/provider/ProviderInboxScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import type { ProviderTabParams } from './types';

const ACTIVE = '#C1440E';
const INACTIVE = '#999';
const BG = '#F5F0EB';

const Tab = createBottomTabNavigator<ProviderTabParams>();

export function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: '#E8E0D8',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ProviderHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={ProviderJobsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="calendar-text-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={ProviderInboxScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="bell-outline" size={size} color={color} />,
          tabBarBadge: 3,
          tabBarBadgeStyle: { backgroundColor: ACTIVE, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="account-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
