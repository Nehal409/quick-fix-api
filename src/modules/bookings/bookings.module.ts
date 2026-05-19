import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents';
import { AuthenticationModule } from '../authentication';
import { NotificationsModule } from '../notifications';
import { ProvidersModule } from '../providers';
import { RequestsModule } from '../requests';
import { UsersModule } from '../users';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities';
import { BookingsRepository } from './repositories';

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking]),
        AgentsModule,
        AuthenticationModule,
        NotificationsModule,
        ProvidersModule,
        RequestsModule,
        UsersModule,
    ],
    controllers: [BookingsController],
    providers: [BookingsService, BookingsRepository],
    exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
