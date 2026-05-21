import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Please enter your name.' })
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Please enter your city.' })
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Please enter your sector/area.' })
    sector?: string;
}
