/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { StoreMemberRole } from '@prisma/client';
import { IUser } from './user.type';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'all';
export type PermissionResource =
  | 'store'
  | 'member'
  | 'product'
  | 'category'
  | 'order'
  | 'customer'
  | 'inventory'
  | 'tags'
  | 'stockMovement'
  | 'all';
export type Permission = `${PermissionResource}:${PermissionAction}`;

export const PERMISSIONS = {
  // Store permissions
  STORE_CREATE: 'store:create' as Permission,
  STORE_READ: 'store:read' as Permission,
  STORE_UPDATE: 'store:update' as Permission,
  STORE_DELETE: 'store:delete' as Permission,
  STORE_ALL: 'store:all' as Permission,

  // Member permissions
  MEMBER_CREATE: 'member:create' as Permission,
  MEMBER_READ: 'member:read' as Permission,
  MEMBER_UPDATE: 'member:update' as Permission,
  MEMBER_DELETE: 'member:delete' as Permission,
  MEMBER_ALL: 'member:all' as Permission,

  // Product permissions
  PRODUCT_CREATE: 'product:create' as Permission,
  PRODUCT_READ: 'product:read' as Permission,
  PRODUCT_UPDATE: 'product:update' as Permission,
  PRODUCT_DELETE: 'product:delete' as Permission,
  PRODUCT_ALL: 'product:all' as Permission,

  // Category permissions
  CATEGORY_CREATE: 'category:create' as Permission,
  CATEGORY_READ: 'category:read' as Permission,
  CATEGORY_UPDATE: 'category:update' as Permission,
  CATEGORY_DELETE: 'category:delete' as Permission,
  CATEGORY_ALL: 'category:all' as Permission,

  // Order permissions
  ORDER_CREATE: 'order:create' as Permission,
  ORDER_READ: 'order:read' as Permission,
  ORDER_UPDATE: 'order:update' as Permission,
  ORDER_DELETE: 'order:delete' as Permission,
  ORDER_ALL: 'order:all' as Permission,

  // Customer permissions
  CUSTOMER_CREATE: 'customer:create' as Permission,
  CUSTOMER_READ: 'customer:read' as Permission,
  CUSTOMER_UPDATE: 'customer:update' as Permission,
  CUSTOMER_DELETE: 'customer:delete' as Permission,
  CUSTOMER_ALL: 'customer:all' as Permission,

  // Stockmovement permissions
  STOCK_MOVEMENT_CREATE: 'stock-movement:create' as Permission,
  STOCK_MOVEMENT_READ: 'stock-movement:read' as Permission,
  STOCK_MOVEMENT_UPDATE: 'stock-movement:update' as Permission,
  STOCK_MOVEMENT_DELETE: 'stock-movement:delete' as Permission,
  STOCK_MOVEMENT_ALL: 'stock-movement:all' as Permission,

  // Inventory permissions
  INVENTORY_READ: 'inventory:read' as Permission,
  INVENTORY_ALL: 'inventory:all' as Permission,

  // Tags permissions
  TAGS_CREATE: 'tags:create' as Permission,
  TAGS_READ: 'tags:read' as Permission,
  TAGS_UPDATE: 'tags:update' as Permission,
  TAGS_DELETE: 'tags:delete' as Permission,
  TAGS_ALL: 'tags:all' as Permission,

  // Payment store permissions
  PAYMENT_STORE_CREATE: 'payment:create' as Permission,
  PAYMENT_STORE_READ: 'payment:read' as Permission,
  PAYMENT_STORE_UPDATE: 'payment:update' as Permission,
  PAYMENT_STORE_DELETE: 'payment:delete' as Permission,
  PAYMENT_STORE_ALL: 'payment:all' as Permission,

  // Supplier permissions
  SUPPLIER_CREATE: 'supplier:create' as Permission,
  SUPPLIER_READ: 'supplier:read' as Permission,
  SUPPLIER_UPDATE: 'supplier:update' as Permission,
  SUPPLIER_DELETE: 'supplier:delete' as Permission,
  SUPPLIER_ALL: 'supplier:all' as Permission,
  // ADMIN PERMISSIONS
  ALL: 'all:all' as Permission,
} as const;

export interface IUserWithPermissions extends IUser {
  storeId?: string;
  storeRole?: StoreMemberRole | 'OWNER';
  permissions: Permission[];
}
