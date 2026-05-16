import { createZodDto } from 'nestjs-zod';
import { Roles } from 'src/common';
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    name: z.string().min(1, { message: 'Name is required.' }),
    role: z.enum([Roles.CUSTOMER, Roles.PROVIDER], {
        message: 'Role must be customer or provider.',
    }),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
