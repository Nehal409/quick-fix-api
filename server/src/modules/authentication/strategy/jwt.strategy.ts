import { unauthorized } from '@hapi/boom';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { messages } from 'src/common/constants';
import { UsersRepository } from '../../users/repositories';
import { JwtPayload, ValidatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly usersRepository: UsersRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret') ?? '',
        });
    }

    async validate(payload: JwtPayload): Promise<ValidatedUser> {
        const user = await this.usersRepository.findById(payload.userId);

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
