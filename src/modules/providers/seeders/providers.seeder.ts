import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/common/enums';
import { User } from 'src/modules/users/entities';
import { Repository } from 'typeorm';
import { Availability, Provider } from '../entities';
import { CreateSlotData } from '../interfaces';
import { PROVIDER_SEED_DATA } from './provider-seed.data';

/** Standard time windows available for booking */
const SLOT_WINDOWS: { startTime: string; endTime: string }[] = [
    { startTime: '09:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '13:00' },
    { startTime: '14:00', endTime: '16:00' },
    { startTime: '16:00', endTime: '18:00' },
];

/** Returns 'YYYY-MM-DD' for today + offset days */
function dateString(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

@Injectable()
export class ProvidersSeeder {
    private readonly logger = new Logger(ProvidersSeeder.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        @InjectRepository(Provider)
        private readonly providersRepo: Repository<Provider>,
        @InjectRepository(Availability)
        private readonly availabilityRepo: Repository<Availability>,
    ) {}

    /**
     * Seeds 30 mock provider + user pairs, then seeds 14 days of availability
     * slots per provider. Idempotent: skips already-seeded entries.
     */
    async seed(): Promise<void> {
        const existingCount = await this.providersRepo.count();

        if (existingCount >= PROVIDER_SEED_DATA.length) {
            this.logger.log(
                `Providers already seeded (${existingCount} records). Skipping.`,
            );
            return;
        }

        this.logger.log('Seeding 30 mock providers + availability...');
        let created = 0;

        for (const entry of PROVIDER_SEED_DATA) {
            // Check if this seed user already exists (idempotent re-runs)
            const existing = await this.usersRepo.findOne({
                where: { email: entry.email },
            });

            if (existing) {
                this.logger.debug(`Provider user already exists: ${entry.email}`);
                continue;
            }

            // 1. Create the backing user account
            const user = await this.usersRepo.save(
                this.usersRepo.create({
                    email: entry.email,
                    name: entry.name,
                    passwordHash: entry.passwordHash,
                    role: Roles.PROVIDER,
                    location: entry.location,
                }),
            );

            // 2. Create the provider profile linked to that user
            const provider = await this.providersRepo.save(
                this.providersRepo.create({
                    userId: user.id,
                    name: entry.name,
                    phone: entry.phone,
                    location: entry.location,
                    serviceCategories: entry.serviceCategories,
                    specializationTags: entry.specializationTags,
                    rating: entry.rating,
                    onTimePercent: entry.onTimePercent,
                    cancelRate: entry.cancelRate,
                    totalJobs: entry.totalJobs,
                    serviceAreaKm: entry.serviceAreaKm,
                    isAvailable: entry.isAvailable,
                }),
            );

            // 3. Seed 14 days of availability slots
            await this.seedAvailability(provider.id, entry.onTimePercent);

            created++;
        }

        this.logger.log(
            `Providers seeded successfully. Created: ${created} new records.`,
        );
    }

    /**
     * Generates 14 days of time slots for a provider.
     * Providers with higher onTimePercent get more slots (more capacity).
     * Uses SLOT_WINDOWS to create realistic morning/afternoon distribution.
     */
    private async seedAvailability(
        providerId: number,
        onTimePercent: number,
    ): Promise<void> {
        const slots: CreateSlotData[] = [];

        // High-performing providers (onTime ≥ 0.90) offer 3-4 slots/day
        // Lower-performing providers offer 2 slots/day
        const slotsPerDay = onTimePercent >= 0.9 ? SLOT_WINDOWS : SLOT_WINDOWS.slice(0, 2);

        for (let day = 0; day < 14; day++) {
            // Skip Sundays (day index 0 = today, offset by weekday)
            const date = new Date();
            date.setDate(date.getDate() + day);
            if (date.getDay() === 0) continue; // 0 = Sunday

            const dateStr = dateString(day);

            for (const window of slotsPerDay) {
                slots.push({
                    providerId,
                    date: dateStr,
                    startTime: window.startTime,
                    endTime: window.endTime,
                });
            }
        }

        const entities = slots.map((s) =>
            this.availabilityRepo.create({
                providerId: s.providerId,
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                isBooked: false,
                bookingId: null,
            }),
        );

        await this.availabilityRepo.save(entities);
    }
}
