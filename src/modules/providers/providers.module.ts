import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities';
import { AvailabilityService } from './availability.service';
import { Availability, Provider } from './entities';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { AvailabilityRepository, ProvidersRepository } from './repositories';
import { ProvidersSeeder } from './seeders';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Provider,
            Availability,
            User, // needed by ProvidersSeeder to create backing user rows
        ]),
    ],
    controllers: [ProvidersController],
    providers: [
        ProvidersService,
        ProvidersRepository,
        AvailabilityService,
        AvailabilityRepository,
        ProvidersSeeder,
    ],
    exports: [ProvidersService, ProvidersRepository, AvailabilityService, AvailabilityRepository],
})
export class ProvidersModule {}
