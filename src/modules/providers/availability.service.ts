import { Injectable, Logger } from '@nestjs/common';
import { notFound } from '@hapi/boom';
import { LogModuleTypes } from 'src/common';
import { Availability } from './entities';
import { CreateSlotData, SlotSummary, SlotWindow } from './interfaces';
import { AvailabilityRepository } from './repositories';

@Injectable()
export class AvailabilityService {
    private readonly logger = new Logger(AvailabilityService.name);

    constructor(private readonly availabilityRepository: AvailabilityRepository) {}

    async findById(slotId: number): Promise<Availability> {
        const slot = await this.availabilityRepository.findById(slotId);
        if (!slot) {
            throw notFound('Slot not found.');
        }
        return slot;
    }

    async getSlotsByProvider(providerId: number): Promise<SlotSummary[]> {
        const slots = await this.availabilityRepository.findByProvider(providerId);
        return slots.map(this.toSummary);
    }

    async getSlotsByProviderAndDate(providerId: number, date: string): Promise<SlotSummary[]> {
        const slots = await this.availabilityRepository.findByProviderAndDate(providerId, date);
        return slots.map(this.toSummary);
    }

    /**
     * Returns free slots for a provider that fit within a requested time window.
     * Called by the Discovery Agent when evaluating "Capacity in window" factor.
     */
    async getFreeSlots(providerId: number, window: SlotWindow): Promise<SlotSummary[]> {
        const slots = await this.availabilityRepository.findFreeInWindow(providerId, window);
        return slots.map(this.toSummary);
    }

    /**
     * Returns the count of free slots in a date range.
     * Used by MatchingModule for the capacity scoring factor.
     */
    async countFreeInDateRange(
        providerId: number,
        fromDate: string,
        toDate: string,
    ): Promise<number> {
        return this.availabilityRepository.countFreeInDateRange(providerId, fromDate, toDate);
    }

    async createSlot(data: CreateSlotData): Promise<SlotSummary> {
        const slot = await this.availabilityRepository.create(data);
        return this.toSummary(slot);
    }

    async createSlotsBulk(slots: CreateSlotData[]): Promise<void> {
        await this.availabilityRepository.createMany(slots);
        this.logger.debug(`Created ${slots.length} availability slots`, {
            module: LogModuleTypes.PROVIDERS,
        });
    }

    /**
     * Mark a slot as booked. Called by BookingAgent during booking confirmation.
     * Throws 404 if the slot does not exist.
     */
    async bookSlot(slotId: number, bookingId: number): Promise<void> {
        await this.findById(slotId); // guard: slot must exist
        await this.availabilityRepository.markAsBooked(slotId, bookingId);
        this.logger.log(`Slot ${slotId} marked as booked (bookingId=${bookingId})`, {
            module: LogModuleTypes.PROVIDERS,
        });
    }

    /**
     * Free a slot on booking cancellation. Called by BookingsModule cancel endpoint.
     * Throws 404 if the slot does not exist.
     */
    async freeSlot(slotId: number): Promise<void> {
        await this.findById(slotId); // guard: slot must exist
        await this.availabilityRepository.freeSlot(slotId);
        this.logger.log(`Slot ${slotId} freed`, { module: LogModuleTypes.PROVIDERS });
    }

    private toSummary(slot: Availability): SlotSummary {
        return {
            id: slot.id,
            providerId: slot.providerId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: slot.isBooked,
            bookingId: slot.bookingId,
        };
    }
}
