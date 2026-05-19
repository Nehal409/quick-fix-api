import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Provider } from '../entities';
import { CreateProviderData } from '../interfaces';

export interface FindCandidatesQuery {
    category: string;
    sector?: string | null;
    city?: string | null;
    limit?: number;
}

@Injectable()
export class ProvidersRepository {
    constructor(
        @InjectRepository(Provider)
        private readonly repo: Repository<Provider>,
    ) {}

    async findById(id: number): Promise<Provider | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByUuid(uuid: string): Promise<Provider | null> {
        return this.repo.findOne({ where: { uuid } });
    }

    async findByUserId(userId: number): Promise<Provider | null> {
        return this.repo.findOne({ where: { userId } });
    }

    async findManyByIds(ids: number[]): Promise<Provider[]> {
        if (ids.length === 0) return [];
        return this.repo.find({ where: { id: In(ids) } });
    }

    async create(data: CreateProviderData): Promise<Provider> {
        return this.repo.save(
            this.repo.create({
                userId: data.userId,
                displayName: data.displayName,
                serviceCategories: data.serviceCategories,
                specializationTags: data.specializationTags ?? [],
                serviceAreas: data.serviceAreas,
                homeSector: data.homeSector,
                homeCity: data.homeCity,
                homeLat: data.homeLat ?? null,
                homeLng: data.homeLng ?? null,
                experienceYears: data.experienceYears,
                baseVisitFee: data.baseVisitFee,
                rating: data.rating ?? 0,
                reviewCount: data.reviewCount ?? 0,
                onTimePercent: data.onTimePercent ?? 0,
                cancelRate: data.cancelRate ?? 0,
                completedJobs30d: data.completedJobs30d ?? 0,
                isActive: data.isActive ?? true,
            }),
        );
    }

    async count(): Promise<number> {
        return this.repo.count();
    }

    /**
     * Discovery query. Filters active providers serving the requested category, preferring those
     * who cover the user's sector. Falls back to city-wide if no sector matches. Returns ordered
     * by an initial heuristic so the Ranking Agent has a sensible pool to score precisely.
     */
    async findCandidates(query: FindCandidatesQuery): Promise<Provider[]> {
        const limit = query.limit ?? 10;
        const qb = this.repo
            .createQueryBuilder('p')
            .where('p.isActive = :active', { active: true })
            .andWhere(':category = ANY(p.serviceCategories)', { category: query.category });

        if (query.sector) {
            qb.andWhere(
                '(:sector = ANY(p.serviceAreas) OR p.homeSector = :sector OR p.homeCity = :city)',
                { sector: query.sector, city: query.city ?? null },
            );
        } else if (query.city) {
            qb.andWhere('p.homeCity = :city', { city: query.city });
        }

        return qb
            .orderBy('p.rating', 'DESC')
            .addOrderBy('p.onTimePercent', 'DESC')
            .addOrderBy('p.cancelRate', 'ASC')
            .limit(limit)
            .getMany();
    }
}
