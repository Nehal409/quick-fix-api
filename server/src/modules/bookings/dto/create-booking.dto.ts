import { IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
    @IsUUID('4', { message: 'requestId must be a valid UUID.' })
    requestId: string;

    @IsUUID('4', { message: 'providerId must be a valid UUID.' })
    providerId: string;

    /**
     * Optional ISO timestamp override. When omitted, the booking falls back to
     * the request's parsed intent.when.start.
     */
    @IsOptional()
    scheduledAt?: string;
}
