import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CancelledBy } from '../enums';

export class CancelBookingDto {
    @IsString()
    @MaxLength(64)
    reason: string;

    @IsEnum(CancelledBy, { message: 'cancelledBy must be customer or provider.' })
    cancelledBy: CancelledBy;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
