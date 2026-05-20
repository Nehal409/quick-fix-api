import { Roles } from 'src/common';

export interface UserProfileResponse {
    uuid: string;
    email: string;
    name: string;
    role: Roles;
    city: string | null;
    sector: string | null;
    createdAt: Date;
}

export interface CreateUserData {
    email: string;
    passwordHash: string;
    name: string;
    role: Roles;
    city: string;
    sector: string;
}
