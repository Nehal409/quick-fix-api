import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { descriptions, messages } from 'src/common/constants';
import { Roles } from 'src/common/enums';
import { Roles as RequireRole } from '../authentication/decorators/roles.decorator';
import { JwtAuthGuard, RoleGuard } from '../authentication/guards';
import { AuthenticatedRequest } from '../authentication/interfaces';
import { BookingsService } from './bookings.service';
import { CancelBookingDto, CreateBookingDto, UpdateBookingStatusDto } from './dto';
import {
    BookingDetailResponse,
    BookingView,
    BookingsListResponse,
    CancelBookingResponse,
    CreateBookingResponse,
} from './interfaces';

@ApiBearerAuth()
@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) {}

    @ApiOperation({ description: descriptions.BOOKING.CREATE })
    @RequireRole(Roles.CUSTOMER)
    @Post()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateBookingDto,
    ): Promise<{ message: string; data: CreateBookingResponse }> {
        const data = await this.bookingsService.create(req.user.userId, dto);
        return { message: messages.BOOKING.CREATED_SUCCESS, data };
    }

    @ApiOperation({ description: descriptions.BOOKING.LIST })
    @Get()
    async list(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string; data: BookingsListResponse }> {
        const data =
            req.user.role === Roles.PROVIDER
                ? await this.bookingsService.listForProvider(req.user.userId)
                : await this.bookingsService.listForCustomer(req.user.userId);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }

    @ApiOperation({ description: descriptions.BOOKING.DETAIL })
    @Get(':uuid')
    async detail(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
    ): Promise<{ message: string; data: BookingDetailResponse }> {
        const data =
            req.user.role === Roles.PROVIDER
                ? await this.bookingsService.getDetailForProvider(req.user.userId, uuid)
                : await this.bookingsService.getDetailForCustomer(req.user.userId, uuid);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }

    @ApiOperation({ description: descriptions.BOOKING.UPDATE_STATUS })
    @RequireRole(Roles.PROVIDER)
    @Patch(':uuid/status')
    async updateStatus(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateBookingStatusDto,
    ): Promise<{ message: string; data: { booking: BookingView } }> {
        const data = await this.bookingsService.updateStatus(req.user.userId, uuid, dto);
        return { message: messages.BOOKING.STATUS_UPDATED, data };
    }

    @ApiOperation({ description: descriptions.BOOKING.CANCEL })
    @Post(':uuid/cancel')
    async cancel(
        @Req() req: AuthenticatedRequest,
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: CancelBookingDto,
    ): Promise<{ message: string; data: CancelBookingResponse }> {
        const data = await this.bookingsService.cancel(req.user.userId, uuid, dto);
        return { message: messages.BOOKING.CANCELLED_SUCCESS, data };
    }
}
