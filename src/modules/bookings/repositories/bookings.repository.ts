import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeepPartial, Repository } from 'typeorm';
import { Booking } from '../entities';
import { BookingStatus } from '../enums';

export interface ListBookingsQuery {
    customerId?: number;
    providerId?: number;
    status?: BookingStatus;
    from?: Date;
    to?: Date;
}

@Injectable()
export class BookingsRepository {
    constructor(
        @InjectRepository(Booking)
        private readonly repo: Repository<Booking>,
    ) {}

    async create(data: DeepPartial<Booking>): Promise<Booking> {
        return this.repo.save(this.repo.create(data));
    }

    async findByUuid(uuid: string): Promise<Booking | null> {
        return this.repo.findOne({ where: { uuid } });
    }

    async findByUuidForCustomer(uuid: string, customerId: number): Promise<Booking | null> {
        return this.repo.findOne({ where: { uuid, customerId } });
    }

    async findByUuidForProvider(uuid: string, providerId: number): Promise<Booking | null> {
        return this.repo.findOne({ where: { uuid, providerId } });
    }

    async update(id: number, data: DeepPartial<Booking>): Promise<Booking> {
        await this.repo.update(id, data);
        return this.repo.findOneOrFail({ where: { id } });
    }

    async list(query: ListBookingsQuery): Promise<Booking[]> {
        const where: Record<string, unknown> = {};
        if (query.customerId != null) where.customerId = query.customerId;
        if (query.providerId != null) where.providerId = query.providerId;
        if (query.status) where.status = query.status;
        if (query.from && query.to) where.scheduledAt = Between(query.from, query.to);
        return this.repo.find({ where, order: { scheduledAt: 'DESC' } });
    }

    async sumQuotedTotalThisYear(customerId: number): Promise<{ count: number; total: number }> {
        const start = new Date(new Date().getFullYear(), 0, 1);
        const rows = await this.repo
            .createQueryBuilder('b')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(b.final_total), SUM(b.quoted_total))', 'total')
            .where('b.customer_id = :customerId', { customerId })
            .andWhere('b.created_at >= :start', { start })
            .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
            .getRawOne<{ count: string; total: string | null }>();
        return {
            count: Number(rows?.count ?? 0),
            total: Number(rows?.total ?? 0),
        };
    }
}
