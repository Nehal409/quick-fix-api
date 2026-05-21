export type Language = 'en' | 'ur' | 'roman-ur';
// API uses roman_ur — map with toApiLang() helper in api.ts
export type ApiLanguage = 'en' | 'ur' | 'roman_ur' | 'auto';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'auto_rescheduled'
  | 'disputed';

export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';

// ── User ──────────────────────────────────────────────
// API uses { name, role: 'customer'|'provider' }
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'provider';
}

// ── Auth payloads ─────────────────────────────────────
export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'customer' | 'provider';
  city: string;
  sector: string;
}

// ── Service Request (POST /requests response) ─────────
export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  icon: string;
}

export interface IntentData {
  service: { category: string; label: string; severity: string };
  location: { city?: string; sector?: string };
  when: { start: string | null; end: string | null; window: string | null };
  budget: { priceSensitive: boolean; currency: string | null; max: number | null };
  urgency: string;
  confidence: number;
  languageDetected?: string;
  extractedFields?: ExtractedField[];
  glosses?: Array<{ ur: string; en: string }>;
}

// ── Legacy clarification types (kept for reference) ──
export interface ClarificationQuestion {
  key: string;
  label: string;
  options?: string[];
  type: 'choice' | 'text';
  placeholder?: string;
}

export interface ClarificationData {
  summary: string;
  questions: ClarificationQuestion[];
  confidence: number;
  ambiguities: number;
  agentTrace?: string;
}

// ── Real API clarification types ──────────────────────
export interface ApiClarificationOption {
  value: string;
  label: string;
  recommended?: boolean;
}

export interface ApiClarification {
  id: string;
  prompt: string;
  fieldTarget: string;
  type: 'choice' | 'text';
  options?: ApiClarificationOption[];
}

export interface ApiPartialIntent {
  service?: { category: string; label: string; severity: string };
  location?: { city?: string; sector?: string };
  when?: { start: string | null; end: string | null; window: string | null };
  budget?: { priceSensitive: boolean; currency: string | null; max: number | null };
  urgency?: string;
  confidence: number;
  languageDetected?: string;
  extractedFields?: ExtractedField[];
}

export interface ApiRequestData {
  requestId: string;
  traceId?: string;
  status: 'needs_clarification' | 'ready' | 'matched' | 'pending';
  partialIntent?: ApiPartialIntent;
  clarifications?: ApiClarification[];
  candidates?: Candidate[];
  intent?: IntentData;
}

export interface ApiRequestEnvelope {
  data: ApiRequestData;
  message: string;
  success: boolean;
}

export interface Candidate {
  providerId: string;
  displayName: string;
  matchScore: number;
  isBestMatch: boolean;
  tag?: string;
  distance: string;
  eta: string;
  priceEstimate: string;
}

export interface ServiceRequest {
  id: string;
  status: 'clarifying' | 'ready' | 'pending';
  language?: string;
  intent: IntentData | null;
  clarification: ClarificationData | null;
  candidates: Candidate[] | null;
}

// ── Booking ───────────────────────────────────────────
export interface CreateBookingPayload {
  requestId: string;
  providerId: string;
  scheduledAt?: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  provider: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
  };
  scheduledAt: string;
  address?: string;
  service?: string;
  totalPrice: number;
  whatsappPayload?: {
    message: string;
    to: string;
  };
}

// ── Notifications ─────────────────────────────────────
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ── Legacy stubs (keep for existing screens that haven't been updated) ──
export interface Provider {
  id: string;
  business_name: string;
  rating: number;
  distance_km: number;
  eta_minutes: number;
  visit_fee: number;
  area: string;
  lat: number;
  lng: number;
  specialization: string[];
  is_available: boolean;
}

export interface FeedbackPayload {
  booking_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface DisputePayload {
  booking_id: string;
  reason_category: string;
  description: string;
  photo_url?: string;
}

// ── Chat history (GET /requests/:id/chat) ─────────────
export interface ChatTurn {
  role: 'user' | 'agent';
  type?: string;
  text?: string;
  content?: string;
  clarifications?: ApiClarification[];
  intent?: IntentData;
  candidates?: Candidate[];
  answers?: Record<string, string>;
  timestamp?: string;
}

export interface ChatHistoryResponse {
  requestId: string;
  status: string;
  turns?: ChatTurn[];
  intent?: IntentData;
  candidates?: Candidate[];
  clarifications?: ApiClarification[];
}
