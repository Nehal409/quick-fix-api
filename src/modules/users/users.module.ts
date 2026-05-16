import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { UsersRepository } from './repositories';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
