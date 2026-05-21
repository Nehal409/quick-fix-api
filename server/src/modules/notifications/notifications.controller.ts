import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { descriptions, messages } from 'src/common/constants';
import { JwtAuthGuard } from '../authentication/guards';
import { AuthenticatedRequest } from '../authentication/interfaces';
import { NotificationsResponse } from './interfaces';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @ApiOperation({ description: descriptions.NOTIFICATION.LIST })
    @Get()
    async list(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string; data: NotificationsResponse }> {
        const data = await this.notificationsService.listForUser(req.user.userId);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }

    @ApiOperation({ description: descriptions.NOTIFICATION.MARK_READ })
    @Post(':uuid/read')
    async markRead(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
    ): Promise<{ message: string }> {
        await this.notificationsService.markRead(req.user.userId, uuid);
        return { message: messages.NOTIFICATION.MARKED_READ };
    }
}
