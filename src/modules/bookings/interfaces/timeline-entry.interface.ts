export type TimelineKey =
    | 'booking_confirmed'
    | 'reminder_sent'
    | 'en_route'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export interface TimelineEntry {
    key: TimelineKey;
    label: string;
    timestamp: string; // ISO 8601
    done: boolean;
    current?: boolean;
    sub?: string;
    agentTrace?: string;
}
