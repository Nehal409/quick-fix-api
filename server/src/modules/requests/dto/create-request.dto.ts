import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
