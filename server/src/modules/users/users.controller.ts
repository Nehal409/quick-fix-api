import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { descriptions, messages } from 'src/common/constants';
import { JwtAuthGuard } from '../authentication/guards';
import { AuthenticatedRequest } from '../authentication/interfaces';
import { UpdateUserDto } from './dto';
import { UserProfileResponse } from './interfaces';
import { UsersService } from './users.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiOperation({ description: descriptions.USER.GET_USER_DETAILS })
    @Get('me')
    async getProfile(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string; data: UserProfileResponse }> {
        const user = await this.usersService.getProfile(req.user.userId);
        return { message: messages.DATA_FETCHED_SUCCESS, data: user };
    }

    @ApiOperation({ description: descriptions.USER.UPDATE_USER })
    @Patch('me')
    async update(
        @Req() req: AuthenticatedRequest,
        @Body() dto: UpdateUserDto,
    ): Promise<{ message: string }> {
        await this.usersService.update(req.user.userId, dto);
        return { message: messages.USER.UPDATE };
    }
}
