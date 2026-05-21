import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BookingStatus } from '../enums';

const PROVIDER_TRANSITIONS = [
    BookingStatus.EN_ROUTE,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
] as const;

export class UpdateBookingStatusDto {
    @IsEnum(PROVIDER_TRANSITIONS, {
        message: 'status must be en_route, in_progress, or completed.',
    })
    status: (typeof PROVIDER_TRANSITIONS)[number];

    @IsOptional()
    @IsString()
    @MaxLength(280)
    note?: string;
}
