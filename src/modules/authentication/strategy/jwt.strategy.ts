import { unauthorized } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { messages } from 'src/common/constants';
import { PrismaService } from 'src/prisma';
import { JwtPayload, ValidatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret') ?? '',
        });
    }

    async validate(payload: JwtPayload): Promise<ValidatedUser> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { id: payload.userId },
        });

        if (!user) {
            throw unauthorized(messages.USER.NOT_FOUND);
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
    }
}
