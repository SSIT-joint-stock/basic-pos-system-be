import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ForbiddenError, NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { PermissionService } from 'app/permissions/permission.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}
  private readonly errMsg = {
    STORE_NOT_FOUND: 'Cửa hàng không tồn tại',
    STORE_ALREADY_EXISTS: 'Cửa hàng đã tồn tại',
  };
  async create(createStoreDto: CreateStoreDto, user: IUser) {
    // create store when user is owner
    return await this.prismaService.store.create({
      data: {
        ...createStoreDto,
        owner_id: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(user: IUser) {
    // find all store when user is owner or memeber
    return await this.prismaService.store.findMany({
      where: {
        OR: [
          {
            owner_id: user.id,
          },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            customer: true,
            members: true,
          },
        },
      },
    });
  }

  async findOne(storeId: string, user: IUser) {
    // check user have access to the store members and owner in this store will access dc
    const hasAccess = await this.checkStoreAccess(storeId, user.id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this store');
    }
    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        store_payment: {
          select: {
            bank_qr_image_url: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            customer: true,
            members: true,
          },
        },
      },
    });
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return store;
  }

  async update(storeId: string, updateStoreDto: UpdateStoreDto, user: IUser) {
    // Only store owner can update this store
    const isOwner = await this.checkIsOwner(storeId, user.id);

    if (!isOwner) {
      throw new ForbiddenError('Only store owner can update store information');
    }

    return await this.prismaService.store.update({
      where: { id: storeId },
      data: {
        ...updateStoreDto,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async remove(storeId: string, user: IUser) {
    // Only store owner can delete this store
    const isOwner = await this.checkIsOwner(storeId, user.id);
    if (!isOwner) {
      throw new ForbiddenError('Only store owner can delete store');
    }
    return await this.prismaService.store.delete({
      where: { id: storeId },
    });
  }
  async getPermissionsInStore(storeId: string, user: IUser) {
    return await this.permissionService.getUserWithPermissions(storeId, user);
  }
  async checkStore(storeId: string) {
    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) {
      throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    }
  }

  async findAllPaginated(prismaQuery: Prisma.StoreFindManyArgs) {
    const [data, total] = await Promise.all([
      this.prismaService.store.findMany(prismaQuery),
      this.prismaService.store.count({ where: prismaQuery.where }),
    ]);
    return { data, total };
  }

  async getStoreAdminStats() {
    const [total, byCity, newToday] = await Promise.all([
      this.prismaService.store.count(),
      this.prismaService.store.groupBy({
        by: ['city'],
        _count: { _all: true },
      }),
      this.prismaService.store.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total,
      newToday,
      byCity: byCity.reduce(
        (acc, c) => ({ ...acc, [c.city || 'Unknown']: c._count._all }),
        {} as Record<string, number>,
      ),
    };
  }

  async findOneAdmin(storeId: string) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      include: {
        owner: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: {
            products: true,
            members: true,
            orders: true,
          },
        },
      },
    });
    if (!store) throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    return store;
  }

  // HELPER METHODS PRIVATE
  private async checkStoreAccess(
    storeId: string,
    userId: string,
  ): Promise<boolean> {
    const store = await this.prismaService.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { owner_id: userId }, // User is owner
          {
            members: {
              some: {
                userId: userId, // User is member
              },
            },
          },
        ],
      },
    });

    return !!store;
  }
  private async checkIsOwner(
    storeId: string,
    ownerId: string,
  ): Promise<boolean> {
    const hasAccess = await this.prismaService.store.findFirst({
      where: {
        id: storeId,
        owner_id: ownerId,
      },
    });

    return !!hasAccess;
  }
}
