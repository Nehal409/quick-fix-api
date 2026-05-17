import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/common/enums';
import { User } from 'src/modules/users/entities';
import { Repository } from 'typeorm';
import { Provider } from '../entities';
import { PROVIDER_SEED_DATA } from './provider-seed.data';

@Injectable()
export class ProvidersSeeder {
    private readonly logger = new Logger(ProvidersSeeder.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        @InjectRepository(Provider)
        private readonly providersRepo: Repository<Provider>,
    ) {}

    /**
     * Seeds 30 mock provider + user pairs.
     * Idempotent: skips already-seeded entries by checking email uniqueness.
     * Called once on application bootstrap via ProvidersModule.
     */
    async seed(): Promise<void> {
        const existingCount = await this.providersRepo.count();

        if (existingCount >= PROVIDER_SEED_DATA.length) {
            this.logger.log(
                `Providers already seeded (${existingCount} records). Skipping.`,
            );
            return;
        }

        this.logger.log('Seeding 30 mock providers...');
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

            // Create the backing user account
            const user = await this.usersRepo.save(
                this.usersRepo.create({
                    email: entry.email,
                    name: entry.name,
                    passwordHash: entry.passwordHash,
                    role: Roles.PROVIDER,
                    location: entry.location,
                }),
            );

            // Create the provider profile linked to that user
            await this.providersRepo.save(
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

            created++;
        }

        this.logger.log(`Providers seeded successfully. Created: ${created} new records.`);
    }
}
