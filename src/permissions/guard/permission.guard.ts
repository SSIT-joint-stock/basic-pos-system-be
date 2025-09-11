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

import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from 'app/common/response';
import { IUser } from 'app/common/types/user.type';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector, // doc metadata
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lay required permissions tu decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return Promise.resolve(true);
    }

    // Lay permission logic or hay and
    const logic = this.reflector.getAllAndOverride<PermissionLogic>(
      PERMISSION_LOGIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user: IUser = request.user;

    //Check : StoreId validation
    const storeId = this.extractStoreId(request);
    if (!storeId) {
      throw new ValidationError('StoreId is required for permission check');
    }

    //Check: Store existence
    await this.validateStoreExists(storeId);

    //Check: User has access to store (owner or member)
    await this.validateUserStoreAccess(storeId, user.id);

    //Check : Permission validation
    const userPermissions = await this.permissionService.getUserPermissions(
      storeId,
      user.id,
    );

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
        storeId,
        user.id,
      );
      throw new ForbiddenError(
        `Access Denied! You do not have permission to perform this action. Role: ${role}`,
      );
    }

    // Attach user with permissions to request
    const userWithPermissions =
      await this.permissionService.getUserWithPermissions(storeId, user);
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

  //Validate store exists
  private async validateStoreExists(storeId: string): Promise<void> {
    const store = await this.permissionService.findStoreById(storeId);
    if (!store) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }
  }

  //Validate user has access to store
  private async validateUserStoreAccess(
    storeId: string,
    userId: string,
  ): Promise<void> {
    const role = await this.permissionService.getUserStoreRole(storeId, userId);
    if (!role) {
      throw new ForbiddenError(
        'Access Denied! You are not a member of this store',
      );
    }
  }
}
