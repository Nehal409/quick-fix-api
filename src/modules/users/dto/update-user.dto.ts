import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: 'Ahmed Ali',
        description: 'Full display name of the user.',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Name cannot be blank.' })
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: 'G-13/1, Islamabad',
        description: 'User location or service area. Used by agents for provider matching.',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Location cannot be blank.' })
    @MaxLength(255)
    location?: string;
}
