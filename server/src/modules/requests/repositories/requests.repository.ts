import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ServiceRequest } from '../entities';

@Injectable()
export class RequestsRepository {
    constructor(
        @InjectRepository(ServiceRequest)
        private readonly repo: Repository<ServiceRequest>,
    ) {}

    async create(data: DeepPartial<ServiceRequest>): Promise<ServiceRequest> {
        return this.repo.save(this.repo.create(data));
    }

    async findByUuid(uuid: string): Promise<ServiceRequest | null> {
        return this.repo.findOne({ where: { uuid } });
    }

    async findByUuidForUser(uuid: string, userId: number): Promise<ServiceRequest | null> {
        return this.repo.findOne({ where: { uuid, userId } });
    }

    async update(id: number, data: DeepPartial<ServiceRequest>): Promise<ServiceRequest> {
        await this.repo.update(id, data);
        return this.repo.findOneOrFail({ where: { id } });
    }
}
