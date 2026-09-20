import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, AuthUser } from './auth.service';

export const SCHOOL_ROLES = 'school_roles';
export const GLOBAL_ROLES = 'global_roles';
export const SchoolRoles = (...roles: string[]) => SetMetadata(SCHOOL_ROLES, roles);
export const GlobalRoles = (...roles: string[]) => SetMetadata(GLOBAL_ROLES, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('AUTH_REQUIRED');
    request.user = await this.auth.verifyAccessToken(header.slice(7));
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    const global = this.reflector.getAllAndOverride<string[]>(GLOBAL_ROLES, [context.getHandler(), context.getClass()]);
    if (global?.length && !global.includes(user.globalRole)) throw new ForbiddenException('GLOBAL_ROLE_FORBIDDEN');
    const schoolRoles = this.reflector.getAllAndOverride<string[]>(SCHOOL_ROLES, [context.getHandler(), context.getClass()]);
    if (!schoolRoles?.length) return true;
    const schoolId = (request.headers['x-school-id'] as string | undefined) ?? user.schoolId;
    const membership = await this.auth.getActiveMembership(user.userId, schoolId);
    if (!membership || !schoolRoles.includes(membership.role)) throw new ForbiddenException('SCHOOL_ROLE_FORBIDDEN');
    request.schoolId = membership.schoolId;
    request.membership = membership;
    return true;
  }
}
