import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from '../entities';
import { CreateNotificationData } from '../interfaces';

@Injectable()
export class NotificationsRepository {
    constructor(
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,
    ) {}

    async create(data: CreateNotificationData): Promise<Notification> {
        return this.repo.save(
            this.repo.create({
                userId: data.userId,
                type: data.type,
                tone: data.tone,
                icon: data.icon,
                title: data.title,
                body: data.body,
                cta: data.cta ?? null,
                metadata: data.metadata ?? null,
                bookingId: data.bookingId ?? null,
                requestId: data.requestId ?? null,
            }),
        );
    }

    async listForUser(userId: number, limit = 50): Promise<Notification[]> {
        return this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async findByUuidForUser(uuid: string, userId: number): Promise<Notification | null> {
        return this.repo.findOne({ where: { uuid, userId } });
    }

    async markRead(id: number): Promise<void> {
        await this.repo.update(id, { readAt: new Date() });
    }

    async unreadCount(userId: number): Promise<number> {
        return this.repo.count({ where: { userId, readAt: IsNull() } });
    }
}
