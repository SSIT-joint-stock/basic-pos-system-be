import { SetMetadata } from '@nestjs/common';
import { Permission } from './../types/permission.type';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_LOGIC_KEY = 'permission_logic';

export type PermissionLogic = 'AND' | 'OR';

/**
 * Decorator yêu cầu permission cho 1 route
 * @param permissions Danh sách permission cần thiết
 * @param logic 'AND' = phải có tất cả, 'OR' = chỉ cần có 1 (default: 'AND')
 */
export const RequirePermissions = (
  permissions: Permission[],
  logic: PermissionLogic = 'AND',
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(PERMISSION_LOGIC_KEY, logic)(target, propertyKey, descriptor);
  };
};

// Aliases cho dễ dùng
export const RequirePermission = RequirePermissions; // alias rõ nghĩa
export const AnyPermission = (permissions: Permission[]) =>
  RequirePermissions(permissions, 'OR');
