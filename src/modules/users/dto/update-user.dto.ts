import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
    name: z
        .string({ required_error: 'Please enter your name.' })
        .min(1, { message: 'Please enter your name.' })
        .optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
