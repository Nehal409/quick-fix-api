import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { descriptions, messages } from 'src/common/constants';
import { Roles } from 'src/common/enums';
import { Roles as RequireRole } from '../authentication/decorators/roles.decorator';
import { JwtAuthGuard, RoleGuard } from '../authentication/guards';
import { AuthenticatedRequest } from '../authentication/interfaces';
import { ClarifyRequestDto, CreateRequestDto } from './dto';
import { ReasoningResponse, RequestResponse } from './interfaces';
import { RequestsService } from './requests.service';

@ApiBearerAuth()
@ApiTags('Requests')
@Controller('requests')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRole(Roles.CUSTOMER)
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}

    @ApiOperation({ description: descriptions.REQUEST.CREATE })
    @Post()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateRequestDto,
    ): Promise<{ message: string; data: RequestResponse }> {
        const data = await this.requestsService.create(req.user.userId, dto);
        return { message: messageFor(data), data };
    }

    @ApiOperation({ description: descriptions.REQUEST.CLARIFY })
    @Post(':uuid/clarify')
    async clarify(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: ClarifyRequestDto,
    ): Promise<{ message: string; data: RequestResponse }> {
        const data = await this.requestsService.clarify(req.user.userId, uuid, dto);
        return { message: messageFor(data), data };
    }

    @ApiOperation({ description: descriptions.REQUEST.REASONING })
    @Get(':uuid/candidates/:providerUuid/reasoning')
    async getReasoning(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Param('providerUuid', ParseUUIDPipe) providerUuid: string,
    ): Promise<{ message: string; data: ReasoningResponse }> {
        const data = await this.requestsService.getReasoning(req.user.userId, uuid, providerUuid);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }
}

function messageFor(response: RequestResponse): string {
    return response.status === 'ready'
        ? messages.REQUEST.READY
        : messages.REQUEST.NEEDS_CLARIFICATION;
}
