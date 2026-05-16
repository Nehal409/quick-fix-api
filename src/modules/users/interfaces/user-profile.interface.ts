import { UserRole } from '@prisma/client';

export interface UserProfileResponse {
    uuid: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
}
