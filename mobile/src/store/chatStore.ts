import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY_REQUEST_ID = '@quickfix/active_request_id';
const KEY_MESSAGES   = '@quickfix/chat_messages';

interface ChatStoreState {
  activeRequestId: string | null;
  save: (requestId: string, messages: unknown[]) => Promise<void>;
  restore: () => Promise<{ requestId: string | null; messages: unknown[] | null }>;
  clear: () => Promise<void>;
}

export const useChatStore = create<ChatStoreState>(() => ({
  activeRequestId: null,

  save: async (requestId, messages) => {
    await AsyncStorage.setItem(KEY_REQUEST_ID, requestId);
    await AsyncStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
    useChatStore.setState({ activeRequestId: requestId });
  },

  restore: async () => {
    const requestId = await AsyncStorage.getItem(KEY_REQUEST_ID);
    const raw = await AsyncStorage.getItem(KEY_MESSAGES);
    useChatStore.setState({ activeRequestId: requestId });
    return { requestId, messages: raw ? JSON.parse(raw) : null };
  },

  clear: async () => {
    await AsyncStorage.removeItem(KEY_REQUEST_ID);
    await AsyncStorage.removeItem(KEY_MESSAGES);
    useChatStore.setState({ activeRequestId: null });
  },
}));
