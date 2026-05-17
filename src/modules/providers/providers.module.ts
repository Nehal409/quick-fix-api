import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities';
import { Provider } from './entities';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { ProvidersRepository } from './repositories';
import { ProvidersSeeder } from './seeders';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Provider,
            User, // needed by ProvidersSeeder to create backing user rows
        ]),
    ],
    controllers: [ProvidersController],
    providers: [ProvidersService, ProvidersRepository, ProvidersSeeder],
    exports: [ProvidersService, ProvidersRepository],
})
export class ProvidersModule {}
