import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities';
import { CreateSlotData, SlotWindow } from '../interfaces';

@Injectable()
export class AvailabilityRepository {
    constructor(
        @InjectRepository(Availability)
        private readonly repo: Repository<Availability>,
    ) {}

    async findById(id: number): Promise<Availability | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByProvider(providerId: number): Promise<Availability[]> {
        return this.repo.find({
            where: { providerId },
            order: { date: 'ASC', startTime: 'ASC' },
        });
    }

    async findByProviderAndDate(providerId: number, date: string): Promise<Availability[]> {
        return this.repo.find({
            where: { providerId, date },
            order: { startTime: 'ASC' },
        });
    }

    /**
     * Find all FREE slots for a provider that fit within a requested time window.
     * Used by the Discovery Agent for the "Capacity in window" matching factor.
     */
    async findFreeInWindow(providerId: number, window: SlotWindow): Promise<Availability[]> {
        return this.repo
            .createQueryBuilder('slot')
            .where('slot.provider_id = :providerId', { providerId })
            .andWhere('slot.date = :date', { date: window.date })
            .andWhere('slot.start_time >= :startTime', { startTime: window.startTime })
            .andWhere('slot.end_time <= :endTime', { endTime: window.endTime })
            .andWhere('slot.is_booked = false')
            .orderBy('slot.start_time', 'ASC')
            .getMany();
    }

    /**
     * Count free slots for a provider in a date range.
     * Used as the "Capacity in requested window" matching score signal.
     */
    async countFreeInDateRange(
        providerId: number,
        fromDate: string,
        toDate: string,
    ): Promise<number> {
        return this.repo
            .createQueryBuilder('slot')
            .where('slot.provider_id = :providerId', { providerId })
            .andWhere('slot.date >= :fromDate', { fromDate })
            .andWhere('slot.date <= :toDate', { toDate })
            .andWhere('slot.is_booked = false')
            .getCount();
    }

    async create(data: CreateSlotData): Promise<Availability> {
        return this.repo.save(
            this.repo.create({
                providerId: data.providerId,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                isBooked: false,
                bookingId: null,
            }),
        );
    }

    async createMany(slots: CreateSlotData[]): Promise<void> {
        const entities = slots.map((s) =>
            this.repo.create({
                providerId: s.providerId,
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                isBooked: false,
                bookingId: null,
            }),
        );
        await this.repo.save(entities);
    }

    /**
     * Mark a slot as booked. Called by BookingAgent on booking confirmation.
     */
    async markAsBooked(slotId: number, bookingId: number): Promise<void> {
        await this.repo.update(slotId, { isBooked: true, bookingId });
    }

    /**
     * Free a slot on booking cancellation. Called by BookingsModule cancel endpoint.
     */
    async freeSlot(slotId: number): Promise<void> {
        await this.repo.update(slotId, { isBooked: false, bookingId: null });
    }

    async existsForProvider(providerId: number): Promise<boolean> {
        return this.repo.exists({ where: { providerId } });
    }

    async deleteByProvider(providerId: number): Promise<void> {
        await this.repo.delete({ providerId });
    }
}
