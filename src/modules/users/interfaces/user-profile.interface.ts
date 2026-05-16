import { Roles } from 'src/common';

export interface UserProfileResponse {
    uuid: string;
    email: string;
    name: string;
    role: Roles;
    createdAt: Date;
}

export interface CreateUserData {
    email: string;
    passwordHash: string;
    name: string;
    role: Roles;
}
