import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest, ValidatedUser } from '../interfaces';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    matchRoles(roles: string[], userRole: string): boolean {
        return roles.some((role: string): boolean => role === userRole);
    }

    canActivate(context: ExecutionContext): boolean {
        const roles: string[] = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        const request: AuthenticatedRequest = context.switchToHttp().getRequest();
        const user: ValidatedUser = request.user;
        return this.matchRoles(roles, user.role);
    }
}
