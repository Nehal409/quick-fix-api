import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

export class LoginDto extends createZodDto(LoginSchema) {}
