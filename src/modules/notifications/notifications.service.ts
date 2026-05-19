import { notFound } from '@hapi/boom';
import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes, messages } from 'src/common';
import { Notification } from './entities';
import {
    CreateNotificationData,
    NotificationGroup,
    NotificationView,
    NotificationsGroupView,
    NotificationsResponse,
} from './interfaces';
import { NotificationsRepository } from './repositories';

const NOW_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(LogModuleTypes.NOTIFICATIONS);

    constructor(private readonly repository: NotificationsRepository) {}

    async create(data: CreateNotificationData): Promise<Notification> {
        const notification = await this.repository.create(data);
        this.logger.log({
            message: 'Notification created',
            data: {
                userId: data.userId,
                type: data.type,
                bookingId: data.bookingId,
                requestId: data.requestId,
            },
        });
        return notification;
    }

    async listForUser(userId: number): Promise<NotificationsResponse> {
        const [items, unreadCount] = await Promise.all([
            this.repository.listForUser(userId),
            this.repository.unreadCount(userId),
        ]);
        return { groups: this.group(items), unreadCount };
    }

    async markRead(userId: number, uuid: string): Promise<void> {
        const notification = await this.repository.findByUuidForUser(uuid, userId);
        if (!notification) {
            throw notFound(messages.NOTIFICATION.NOT_FOUND);
        }
        if (notification.readAt) return;
        await this.repository.markRead(notification.id);
    }

    private group(items: Notification[]): NotificationsGroupView[] {
        const buckets: Record<NotificationGroup, NotificationView[]> = {
            now: [],
            today: [],
            earlier: [],
        };
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const nowMs = Date.now();

        for (const item of items) {
            const ageMs = nowMs - item.createdAt.getTime();
            const bucket: NotificationGroup =
                ageMs <= NOW_THRESHOLD_MS
                    ? 'now'
                    : item.createdAt >= startOfToday
                      ? 'today'
                      : 'earlier';
            buckets[bucket].push(this.toView(item));
        }

        const groups: NotificationsGroupView[] = [];
        (Object.keys(buckets) as NotificationGroup[]).forEach((title) => {
            if (buckets[title].length > 0) groups.push({ title, items: buckets[title] });
        });
        return groups;
    }

    private toView(item: Notification): NotificationView {
        return {
            id: item.uuid,
            type: item.type,
            tone: item.tone,
            icon: item.icon,
            title: item.title,
            body: item.body,
            cta: item.cta,
            read: item.readAt != null,
            timestamp: item.createdAt.toISOString(),
            bookingId: item.bookingId != null ? String(item.bookingId) : undefined,
            requestId: item.requestId != null ? String(item.requestId) : undefined,
        };
    }
}
