/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PermissionService } from '../permission.service';
import { Reflector } from '@nestjs/core';
import { Permission } from 'app/common/types/permission.type';
import {
  PERMISSION_LOGIC_KEY,
  PermissionLogic,
  PERMISSIONS_KEY,
} from 'app/common/decorators/permission.decorator';
import { IUSER } from 'app/auth/token.service';
import { ForbiddenError, ValidationError } from 'app/common/response';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector, // doc metadata gan o decorator
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // lay required permissions tu decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return Promise.resolve(true);
    }
    // lay permission logic or hay and
    const logic = this.reflector.getAllAndOverride<PermissionLogic>(
      PERMISSION_LOGIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest();
    const user: IUSER = request.user;
    if (!user) {
      throw new ForbiddenError('User not authenticated!');
    }
    // lay storeiD tu request
    const storedId = this.extractStoreId(request);
    if (!storedId) {
      throw new ValidationError('StoreId is required for permission check');
    }
    // lay user permission
    const userPermissions = await this.permissionService.getUserPermissions(
      storedId,
      user.id,
    );
    // kiem tra permission dang theo logic nao
    const hasPermission =
      logic === 'AND'
        ? this.permissionService.hasAllPermissions(
            userPermissions,
            requiredPermissions,
          )
        : this.permissionService.hasAnyPermissions(
            userPermissions,
            requiredPermissions,
          );

    if (!hasPermission) {
      const role = await this.permissionService.getUserStoreRole(
        storedId,
        user.id,
      );
      throw new ForbiddenError(
        `Access Denied! You do not have permission to perform this action. Role: ${role}`,
      );
    }
    const userWithPermissions =
      await this.permissionService.getUserWithPermissions(storedId, user);
    request.userWithPermissions = userWithPermissions;
    return true;
  }

  private extractStoreId(request: any): string | null {
    return (
      request.params?.storeId ||
      request.body?.storeId ||
      request.query?.storeId ||
      null
    );
  }
}
