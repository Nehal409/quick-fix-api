import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities';
import { CreateProviderData, ProviderSummary } from '../interfaces';

@Injectable()
export class ProvidersRepository {
    constructor(
        @InjectRepository(Provider)
        private readonly repo: Repository<Provider>,
    ) {}

    async findById(id: number): Promise<Provider | null> {
        return this.repo.findOne({ where: { id }, relations: ['user'] });
    }

    async findByUserId(userId: number): Promise<Provider | null> {
        return this.repo.findOne({ where: { userId } });
    }

    async findAll(): Promise<Provider[]> {
        return this.repo.find({ relations: ['user'] });
    }

    async existsByUserId(userId: number): Promise<boolean> {
        return this.repo.exists({ where: { userId } });
    }

    async count(): Promise<number> {
        return this.repo.count();
    }

    async create(data: CreateProviderData): Promise<Provider> {
        const provider = this.repo.create({
            userId: data.userId,
            name: data.name,
            phone: data.phone ?? null,
            location: data.location ?? null,
            serviceCategories: data.serviceCategories ?? [],
            specializationTags: data.specializationTags ?? [],
            rating: data.rating ?? 0,
            onTimePercent: data.onTimePercent ?? 1,
            cancelRate: data.cancelRate ?? 0,
            totalJobs: data.totalJobs ?? 0,
            serviceAreaKm: data.serviceAreaKm ?? 10,
            isAvailable: data.isAvailable ?? true,
        });
        return this.repo.save(provider);
    }

    async updateReputation(
        id: number,
        patch: { rating?: number; onTimePercent?: number; cancelRate?: number; totalJobs?: number },
    ): Promise<void> {
        await this.repo.update(id, patch);
    }

    // Used by Matching / Discovery agents to query by availability + location
    async findAvailableByCategories(categories: string[]): Promise<Provider[]> {
        return this.repo
            .createQueryBuilder('provider')
            .where('provider.is_available = :isAvailable', { isAvailable: true })
            .andWhere(
                // Filter where any of the requested categories is in serviceCategories
                'provider.service_categories && ARRAY[:...categories]::text[]',
                { categories },
            )
            .getMany();
    }

    async getSummary(id: number): Promise<ProviderSummary | null> {
        return this.repo.findOne({
            where: { id },
            select: {
                id: true,
                name: true,
                phone: true,
                location: true,
                serviceCategories: true,
                specializationTags: true,
                rating: true,
                onTimePercent: true,
                cancelRate: true,
                totalJobs: true,
                serviceAreaKm: true,
                isAvailable: true,
                createdAt: true,
            },
        });
    }
}
