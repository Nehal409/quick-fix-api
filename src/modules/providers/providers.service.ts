import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { notFound } from '@hapi/boom';
import { LogModuleTypes, messages } from 'src/common';
import { Provider } from './entities';
import { CreateProviderData, ProviderSummary } from './interfaces';
import { ProvidersRepository } from './repositories';
import { ProvidersSeeder } from './seeders';

@Injectable()
export class ProvidersService implements OnModuleInit {
    private readonly logger = new Logger(ProvidersService.name);

    constructor(
        private readonly providersRepository: ProvidersRepository,
        private readonly seeder: ProvidersSeeder,
    ) {}

    /**
     * Run seeder once when the module initialises (after DB connection is ready).
     * OnModuleInit ensures TypeORM is wired before we hit the DB.
     */
    async onModuleInit(): Promise<void> {
        await this.seeder.seed();
    }

    async findById(id: number): Promise<Provider> {
        const provider = await this.providersRepository.findById(id);
        if (!provider) {
            throw notFound(messages.PROVIDER.NOT_FOUND);
        }
        return provider;
    }

    async getSummary(id: number): Promise<ProviderSummary> {
        const summary = await this.providersRepository.getSummary(id);
        if (!summary) {
            throw notFound(messages.PROVIDER.NOT_FOUND);
        }
        return summary;
    }

    async findByUserId(userId: number): Promise<Provider | null> {
        return this.providersRepository.findByUserId(userId);
    }

    /**
     * Auto-called from AuthService when a user registers with role=provider.
     * Creates the provider profile linked to the newly created user.
     */
    async createForUser(data: CreateProviderData): Promise<Provider> {
        this.logger.log('Creating provider profile for new user', {
            module: LogModuleTypes.PROVIDERS,
            data: { userId: data.userId },
        });
        return this.providersRepository.create(data);
    }

    async findAll(): Promise<Provider[]> {
        return this.providersRepository.findAll();
    }

    async findAvailableByCategories(categories: string[]): Promise<Provider[]> {
        return this.providersRepository.findAvailableByCategories(categories);
    }
}
