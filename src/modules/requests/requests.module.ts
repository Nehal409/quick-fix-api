import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents';
import { AuthenticationModule } from '../authentication';
import { NotificationsModule } from '../notifications';
import { ProvidersModule } from '../providers';
import { UsersModule } from '../users';
import { ServiceRequest } from './entities';
import { RequestsRepository } from './repositories';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ServiceRequest]),
        AgentsModule,
        AuthenticationModule,
        NotificationsModule,
        ProvidersModule,
        UsersModule,
    ],
    controllers: [RequestsController],
    providers: [RequestsService, RequestsRepository],
    exports: [RequestsService, RequestsRepository],
})
export class RequestsModule {}
