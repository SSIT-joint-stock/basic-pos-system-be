import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from 'app/common/decorators/roles.decorator';
import { ForbiddenError } from 'app/common/response';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('[RolesGuard] hit'); ////////////////////////////////////
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    console.log('11111111111111111111--', requiredRoles);
    if (!requiredRoles) {
      return true;
    }

    console.log('1111111111111111111111111111111--', requiredRoles);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenError('User not found in request');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenError(`Access denied.`);
    }

    return true;
  }
}
