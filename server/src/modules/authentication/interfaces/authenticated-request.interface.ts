import { Request } from 'express';
import { Roles } from 'src/common';

export interface AuthenticatedRequest extends Request {
    user: {
        userId: number;
        email: string;
        role: Roles;
    };
}
