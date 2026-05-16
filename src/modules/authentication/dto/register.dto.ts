import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Roles } from 'src/common';

export class RegisterDto {
    @IsEmail({}, { message: 'Please enter a valid email address.' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters.' })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'Name is required.' })
    name: string;

    @IsEnum(Roles, { message: 'Role must be customer or provider.' })
    role: Roles;
}
