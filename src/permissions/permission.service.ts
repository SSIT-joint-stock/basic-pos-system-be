import { Injectable } from '@nestjs/common';
import { StoreMemberRole } from '@prisma/client';

import {
  IUserWithPermissions,
  Permission,
  PermissionAction,
  PERMISSIONS,
} from 'app/common/types/permission.type';
import { IUser } from 'app/common/types/user.type';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prismaService: PrismaService) {}

  // role-base permission mapping
  private readonly rolePermissions: Record<
    StoreMemberRole | 'OWNER',
    Permission[]
  > = {
    OWNER: [PERMISSIONS.ALL], // chu co full quyen access
    MEMBER: [
      // cac quyen cua member trong store
      PERMISSIONS.STORE_READ,

      PERMISSIONS.MEMBER_READ,

      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_UPDATE,

      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,

      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      // sau nay co the them nhung quyen khac nhu tao category, tags, inentory, stok movement................
    ],
  };
  // phan tich permission vao resource and action
  private parsePermission(permission: Permission): {
    resource: string;
    action: string;
  } {
    const [resource, action] = permission.split(':');
    return { resource, action };
  }

  // kiem tra xem user co 1 permission cu the hay khong
  //
  hasPermission(
    userPermissions: Permission[], // danh sach quyen cua user
    requiredPermission: Permission, // quyen can kiem tra
  ): boolean {
    // kiem tra xem user co permission nay khong
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    const { resource, action } = this.parsePermission(requiredPermission);

    // kiem tra cac permison ton tai trong roles cua user(wildcard)
    for (const userPermission of userPermissions) {
      const { resource: userResource, action: userAction } =
        this.parsePermission(userPermission);

      // all:all co toan bo quyen truy cay
      if (userResource === 'all' && userAction === 'all') {
        return true;
      }

      // resource:all co toan bo quyen voi resource cu. the nao` do'
      // ex: 'product:all' co' toan bo. quyen voi product do nhu la /read/update/delete/create product
      if (userResource === resource && userAction === 'all') {
        return true;
      }

      // all:action co quyen thuc hien 1 action tren moi resource
      if (userResource === 'all' && userAction === action) {
        return true;
      }
    }
    // neu kh thoa man dieu kien ban dau thi user kh co quyen
    return false;
  }

  // kiem tra multiple permission theo logic AND
  // tra ve true chi khi user co tat ca permission trong requiredPermissions
  // ex: requiredPermissions = [store:create, store:read, store:update] => tra ve true neu user co store:create, store:read, store:update
  // ex: requiredPermissions = [store:create, store:read] => tra ve false neu user khong co store:update

  hasAllPermissions(
    userPermissions: Permission[],
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.every((perm) =>
      this.hasPermission(userPermissions, perm),
    );
  }

  // kiem tra multiple permission theo logic OR
  // tra ve true neu user co it nhat mot permission trong ds requiredPermissions
  // ex: requiredPermissions = [store:create, store:read, store:update] => tra ve true neu user co store:create, store:read, store:update
  // user chi can co store:create => tra ve true
  hasAnyPermissions(
    userPermissions: Permission[],
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.some((perm) =>
      this.hasPermission(userPermissions, perm),
    );
  }

  // lay role cua user trong store (OWNER | StoreMemberRole | null)
  // kien tra owner truoc
  // neu k phai owner thi kien tra member trong store de lay role
  async getUserStoreRole(
    storeId: string,
    userId: string,
  ): Promise<StoreMemberRole | 'OWNER'> {
    // kiem tra xem user co phai owner cua store khong
    const owner = await this.prismaService.store.findFirst({
      where: {
        id: storeId,
        owner_id: userId,
      },
    });
    if (owner) return 'OWNER';
    // kiem tra member trong store
    const member = await this.prismaService.storeMember.findFirst({
      where: {
        storeId,
        userId,
      },
    });

    return member?.role as StoreMemberRole;
  }

  // lay permissions cua user dua tren role cua store
  async getUserPermissions(
    storeId: string,
    userId: string,
  ): Promise<Permission[]> {
    const role = await this.getUserStoreRole(storeId, userId);
    if (!role) return [];
    return this.rolePermissions[role] || [];
  }

  // lay user permissions cua store
  async getUserWithPermissions(
    storeId: string,
    user: IUser,
  ): Promise<IUserWithPermissions> {
    const role = await this.getUserStoreRole(storeId, user.id);

    const permissions = await this.getUserPermissions(storeId, user.id);

    return {
      ...user,
      storeId,
      storeRole: role,
      permissions,
    };
  }

  expandPermissions(permissions: Permission[]): Permission[] {
    const expanded = new Set<Permission>();

    for (const permission of permissions) {
      const { resource, action } = this.parsePermission(permission);

      if (resource === 'all' && action === 'all') {
        // Add all possible permissions
        return Object.values(PERMISSIONS);
      }

      if (action === 'all') {
        // Add all actions for this resource
        const allActions: PermissionAction[] = [
          'create',
          'read',
          'update',
          'delete',
        ];
        for (const act of allActions) {
          expanded.add(`${resource}:${act}` as Permission);
        }
      } else {
        expanded.add(permission);
      }
    }

    return Array.from(expanded);
  }

  // kiem tra store con ton tai khong
  async findStoreById(storeId: string) {
    return await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
      },
    });
  }
  async hasStoreAccess(storeId: string, userId: string) {
    const role = await this.getUserStoreRole(storeId, userId);

    return role !== null;
  }
  async getStoreAccessInfo(storeId: string, userId: string) {
    const store = await this.findStoreById(storeId);
    const role = await this.getUserStoreRole(storeId, userId);
    const permissions = await this.getUserPermissions(storeId, userId);

    return {
      store,
      hasAccess: role !== null,
      role,
      permissions,
      isOwner: role === 'OWNER',
      isMember: role && role !== 'OWNER',
    };
  }
}
