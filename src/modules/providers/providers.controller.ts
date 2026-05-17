import { Controller, Get, Param, ParseIntPipe, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { messages } from 'src/common/constants';
import { JwtAuthGuard } from '../authentication/guards';
import { ProviderSummary } from './interfaces';
import { ProvidersService } from './providers.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
    constructor(private readonly providersService: ProvidersService) {}

    @ApiOperation({ summary: 'Get provider detail by ID (customer view)' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Returns the provider summary.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provider not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid JWT token.' })
    @Get(':id')
    async getProvider(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ message: string; data: ProviderSummary }> {
        const data = await this.providersService.getSummary(id);
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }
}
