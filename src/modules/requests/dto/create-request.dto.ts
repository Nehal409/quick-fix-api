import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

class LocationHintDto {
    @IsOptional()
    @IsString()
    @MaxLength(64)
    sector?: string;

    @IsOptional()
    @IsString()
    @MaxLength(64)
    city?: string;
}

export enum RequestLanguage {
    EN = 'en',
    UR = 'ur',
    ROMAN_UR = 'roman_ur',
    AUTO = 'auto',
}

export class CreateRequestDto {
    @IsString()
    @IsNotEmpty({ message: 'Message is required.' })
    @MinLength(3, { message: 'Message must be at least 3 characters.' })
    @MaxLength(2000, { message: 'Message must be 2000 characters or fewer.' })
    rawInput: string;

    @IsOptional()
    @IsEnum(RequestLanguage, { message: 'Language must be en, ur, roman_ur, or auto.' })
    language?: RequestLanguage;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => LocationHintDto)
    location?: LocationHintDto;
}
