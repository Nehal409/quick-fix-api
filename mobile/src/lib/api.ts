import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import Config from 'react-native-config';
import type {
  RegisterPayload,
  CreateBookingPayload,
  ApiRequestEnvelope,
  ChatHistoryResponse,
  Booking,
  Notification,
  Language,
  ApiLanguage,
  FeedbackPayload,
  DisputePayload,
} from '../types';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const creds = await Keychain.getGenericPassword();
  if (creds) {
    config.headers.Authorization = `Bearer ${creds.password}`;
  }
  
  if (__DEV__) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status, response.data);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.log(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message
      );
    }
    return Promise.reject(error);
  }
);

// Map internal roman-ur → roman_ur for API
function toApiLang(lang: Language | undefined): ApiLanguage {
  if (lang === 'roman-ur') return 'roman_ur';
  if (lang === 'ur') return 'ur';
  if (lang === 'en') return 'en';
  return 'auto';
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: 'customer' | 'provider' } }>(
      '/auth/login',
      { email, password },
    ),

  register: (payload: RegisterPayload) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: 'customer' | 'provider' } }>(
      '/auth/register',
      payload,
    ),
};

// ── Requests (Chat / AI Agent) ────────────────────────
export const requestsApi = {
  create: (
    rawInput: string,
    language: Language,
  ) =>
    api.post<ApiRequestEnvelope>('/requests', {
      rawInput,
      language: toApiLang(language),
    }),

  clarify: (requestId: string, answers: Record<string, string>) =>
    api.post<ApiRequestEnvelope>(`/requests/${requestId}/clarify`, { answers }),

  getChat: (requestId: string) =>
    api.get<ChatHistoryResponse>(`/requests/${requestId}/chat`),

  getReasoning: (requestId: string, providerUuid: string) =>
    api.get(`/requests/${requestId}/candidates/${providerUuid}/reasoning`),
};

// ── Bookings ──────────────────────────────────────────
export const bookingsApi = {
  create: (payload: CreateBookingPayload) =>
    api.post<Booking>('/bookings', payload),

  list: () =>
    api.get<Booking[]>('/bookings'),

  getById: (uuid: string) =>
    api.get<Booking>(`/bookings/${uuid}`),

  updateStatus: (uuid: string, status: string, note?: string) =>
    api.patch(`/bookings/${uuid}/status`, { status, ...(note ? { note } : {}) }),

  cancel: (uuid: string, reason: string, cancelledBy: 'customer' | 'provider', note?: string) =>
    api.post(`/bookings/${uuid}/cancel`, { reason, cancelledBy, ...(note ? { note } : {}) }),
};

// ── Notifications ─────────────────────────────────────
export const notificationsApi = {
  list: () =>
    api.get<{ now: Notification[]; today: Notification[]; earlier: Notification[]; unreadCount: number }>(
      '/notifications',
    ),

  markRead: (uuid: string) =>
    api.post(`/notifications/${uuid}/read`),
};

// ── Feedback & Disputes ───────────────────────────────
export const feedbackApi = {
  submit: (payload: FeedbackPayload) => api.post('/feedback', payload),
};

export const disputesApi = {
  submit: (payload: DisputePayload) => api.post('/disputes', payload),
};

export default api;
