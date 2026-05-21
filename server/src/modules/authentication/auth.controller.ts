import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { descriptions, messages } from 'src/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { AuthResponse } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ description: descriptions.AUTH.REGISTER })
    @Post('register')
    async register(@Body() dto: RegisterDto): Promise<{ message: string; data: AuthResponse }> {
        const result = await this.authService.register(dto);
        return { message: messages.USER.CREATED_SUCCESS, data: result };
    }

    @ApiOperation({ description: descriptions.AUTH.LOGIN })
    @Post('login')
    async login(@Body() dto: LoginDto): Promise<{ message: string; data: AuthResponse }> {
        const result = await this.authService.login(dto);
        return { message: messages.AUTH.LOGIN_SUCCESS, data: result };
    }
}
