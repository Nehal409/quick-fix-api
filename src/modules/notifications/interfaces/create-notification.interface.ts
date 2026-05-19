import { NotificationCta } from '../entities/notification.entity';
import { NotificationTone, NotificationType } from '../enums';

export interface CreateNotificationData {
    userId: number;
    type: NotificationType;
    tone: NotificationTone;
    icon: string;
    title: string;
    body: string;
    cta?: NotificationCta;
    metadata?: Record<string, unknown>;
    bookingId?: number;
    requestId?: number;
}
