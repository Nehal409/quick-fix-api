import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: async (token, user) => {
    if (!token) {
      console.error('setAuth called with null/undefined/empty token!');
      throw new Error('Token is missing or invalid');
    }
    await Keychain.setGenericPassword('quickfix_token', token);
    await AsyncStorage.setItem('quickfix_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem('quickfix_user');
    set({ token: null, user: null });
  },

  rehydrate: async () => {
    const creds = await Keychain.getGenericPassword();
    const userStr = await AsyncStorage.getItem('quickfix_user');
    if (creds && userStr) {
      set({ token: creds.password, user: JSON.parse(userStr) as User });
    }
  },
}));
