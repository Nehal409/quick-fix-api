import { NotificationCta } from '../entities/notification.entity';
import { NotificationTone, NotificationType } from '../enums';

export type NotificationGroup = 'now' | 'today' | 'earlier';

export interface NotificationView {
    id: string;
    type: NotificationType;
    tone: NotificationTone;
    icon: string;
    title: string;
    body: string;
    cta: NotificationCta | null;
    read: boolean;
    timestamp: string;
    bookingId?: string;
    requestId?: string;
}

export interface NotificationsGroupView {
    title: NotificationGroup;
    items: NotificationView[];
}

export interface NotificationsResponse {
    groups: NotificationsGroupView[];
    unreadCount: number;
}
