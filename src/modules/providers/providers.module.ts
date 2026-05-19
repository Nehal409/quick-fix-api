import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './entities';
import { ProvidersService } from './providers.service';
import { ProvidersRepository } from './repositories';
import { ProvidersSeeder } from './seeders';

@Module({
    imports: [TypeOrmModule.forFeature([Provider])],
    providers: [ProvidersService, ProvidersRepository, ProvidersSeeder],
    exports: [ProvidersService, ProvidersRepository],
})
export class ProvidersModule {}
