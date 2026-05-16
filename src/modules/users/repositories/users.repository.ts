import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { UpdateUserDto } from '../dto';
import { UserProfileResponse } from '../interfaces';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async getProfile(id: number): Promise<UserProfileResponse | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                uuid: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async update(id: number, data: UpdateUserDto): Promise<User> {
        return this.prisma.user.update({ where: { id }, data });
    }
}
