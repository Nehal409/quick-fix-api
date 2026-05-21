import { Roles } from 'src/common';

export interface JwtPayload {
    userId: number;
    role: Roles;
}

export interface ValidatedUser {
    userId: number;
    email: string;
    role: Roles;
}
