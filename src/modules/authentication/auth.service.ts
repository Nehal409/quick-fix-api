import { badRequest, unauthorized } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { messages } from 'src/common/constants';
import { Roles } from 'src/common/enums';
import { ProvidersService } from '../providers/providers.service';
import { User } from '../users/entities';
import { UsersRepository } from '../users/repositories';
import { LoginDto, RegisterDto } from './dto';
import { AuthResponse, JwtPayload } from './interfaces';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
        private readonly providersService: ProvidersService,
    ) {}

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const existing = await this.usersRepository.findByEmail(dto.email);
        if (existing) {
            throw badRequest(messages.USER.ALREADY_EXISTS);
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.usersRepository.create({ ...dto, passwordHash });

        // Auto-create a provider profile when registering as a provider
        if (user.role === Roles.PROVIDER) {
            await this.providersService.createForUser({
                userId: user.id,
                name: user.name,
                location: user.location,
            });
        }

        return this.buildAuthResponse(user);
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.usersRepository.findByEmailWithPassword(dto.email);

        if (!user) {
            throw unauthorized(messages.AUTH.INVALID_CREDENTIALS);
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            throw unauthorized(messages.AUTH.INVALID_CREDENTIALS);
        }

        return this.buildAuthResponse(user);
    }

    private buildAuthResponse(user: User): AuthResponse {
        const payload: JwtPayload = { userId: user.id, role: user.role };
        const token = this.jwtService.sign(payload);
        return { token };
    }
}
