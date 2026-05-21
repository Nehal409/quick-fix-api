import { Injectable } from '@nestjs/common';
import { User } from '../users/entities';
import { Provider } from './entities';
import { ProvidersRepository } from './repositories';

@Injectable()
export class ProvidersService {
    constructor(private readonly providersRepository: ProvidersRepository) {}

    /**
     * Create an empty provider profile shell for a newly-registered provider user.
     * The provider fills the real details later via the provider workspace.
     */
    async createForUser(user: User): Promise<Provider> {
        return this.providersRepository.create({
            userId: user.id,
            displayName: user.name,
            serviceCategories: ['ac_repair'],
            specializationTags: [],
            serviceAreas: [],
            homeSector: 'unknown',
            homeCity: 'Islamabad',
            experienceYears: 0,
            baseVisitFee: 1500,
            isActive: false,
        });
    }
}
