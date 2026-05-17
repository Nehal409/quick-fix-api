import { notFound } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import { messages } from 'src/common/constants';
import { UpdateUserDto } from './dto';
import { UserProfileResponse } from './interfaces';
import { UsersRepository } from './repositories';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async getProfile(userId: number): Promise<UserProfileResponse> {
        const user = await this.usersRepository.getProfile(userId);
        if (!user) {
            throw notFound(messages.USER.NOT_FOUND);
        }
        return user;
    }

    async update(userId: number, dto: UpdateUserDto): Promise<UserProfileResponse> {
        await this.getProfile(userId);
        return this.usersRepository.update(userId, dto);
    }
}
