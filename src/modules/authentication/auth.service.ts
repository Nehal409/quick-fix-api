import { badRequest, unauthorized } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { messages } from 'src/common/constants';
import { PrismaService } from 'src/prisma';
import { LoginDto, RegisterDto } from './dto';
import { AuthResponse, JwtPayload } from './interfaces';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw badRequest(messages.USER.ALREADY_EXISTS);
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                role: dto.role,
            },
        });

        return this.buildAuthResponse(user);
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
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
