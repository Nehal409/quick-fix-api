import { UserRole } from '@prisma/client';

export interface JwtPayload {
    userId: number;
    role: UserRole;
}

export interface ValidatedUser {
    userId: number;
    email: string;
    role: UserRole;
}
