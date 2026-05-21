import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication';
import { Notification } from './entities';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories';

@Module({
    imports: [TypeOrmModule.forFeature([Notification]), AuthenticationModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsRepository],
    exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
