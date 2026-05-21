import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '../dto';
import { User } from '../entities';
import { UserProfileResponse, CreateUserData } from '../interfaces';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }

    async create(data: CreateUserData): Promise<User> {
        return this.usersRepository.save(
            this.usersRepository.create({
                email: data.email,
                passwordHash: data.passwordHash,
                name: data.name,
                role: data.role,
                city: data.city,
                sector: data.sector,
            }),
        );
    }

    async getProfile(id: number): Promise<UserProfileResponse | null> {
        return this.usersRepository.findOne({
            where: { id },
            select: {
                uuid: true,
                email: true,
                name: true,
                role: true,
                city: true,
                sector: true,
                createdAt: true,
            },
        });
    }

    async update(id: number, data: UpdateUserDto): Promise<User> {
        await this.usersRepository.update(id, data);
        return this.usersRepository.findOneOrFail({ where: { id } });
    }
}
