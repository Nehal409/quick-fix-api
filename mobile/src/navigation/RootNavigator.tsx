import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { UserTabNavigator } from './UserTabNavigator';
import { ActiveBookingScreen } from '../screens/user/ActiveBookingScreen';
import { FeedbackScreen } from '../screens/user/FeedbackScreen';
import { DisputeScreen } from '../screens/user/DisputeScreen';
import { BookingSuccessScreen } from '../screens/user/BookingSuccessScreen';
import { AutoRescheduleScreen } from '../screens/user/AutoRescheduleScreen';
import { ProvidersScreen } from '../screens/user/ProvidersScreen';
import type { RootStackParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="UserTabs" component={UserTabNavigator} />
            <Stack.Screen name="ActiveBooking" component={ActiveBookingScreen} />
            <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
            <Stack.Screen name="AutoReschedule" component={AutoRescheduleScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="Dispute" component={DisputeScreen} />
            <Stack.Screen name="Providers" component={ProvidersScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
