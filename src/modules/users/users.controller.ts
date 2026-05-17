import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    @ApiResponse({ status: HttpStatus.OK, description: 'Returns the authenticated user profile.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid JWT token.' })
    @Get('me')
    async getProfile(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string; data: UserProfileResponse }> {
        const data = await this.usersService.getProfile(req.user.userId);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }

    @ApiOperation({ description: descriptions.USER.UPDATE_USER })
    @ApiResponse({ status: HttpStatus.OK, description: 'Returns the updated user profile.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid JWT token.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
    @HttpCode(HttpStatus.OK)
    @Patch('me')
    async update(
        @Req() req: AuthenticatedRequest,
        @Body() dto: UpdateUserDto,
    ): Promise<{ message: string; data: UserProfileResponse }> {
        const data = await this.usersService.update(req.user.userId, dto);
        return { message: messages.USER.UPDATE, data };
    }
}
