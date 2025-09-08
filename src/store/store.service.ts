import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { IUSER } from 'app/auth/token.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'app/common/response';
import { StoreMemberRole } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createStoreDto: CreateStoreDto, user: IUSER) {
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

  async findAll(user: IUSER) {
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
          },
        },
      },
    });
  }

  async findOne(id: string, user: IUSER) {
    // check user have access to the store members and owner in this store will access dc
    const hasAccess = await this.checkStoreAccess(id, user.id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this store');
    }
    const store = await this.prismaService.store.findUnique({
      where: {
        id,
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
          },
        },
      },
    });
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, user: IUSER) {
    // Only store owner can update this store
    const isOwner = await this.checkIsOwner(id, user.id);

    if (!isOwner) {
      throw new ForbiddenError('Only store owner can update store information');
    }

    return await this.prismaService.store.update({
      where: { id },
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

  async remove(id: string, user: IUSER) {
    // Only store owner can delete this store
    const isOwner = await this.checkIsOwner(id, user.id);
    if (!isOwner) {
      throw new ForbiddenError('Only store owner can delete store');
    }
    return await this.prismaService.store.delete({
      where: { id },
    });
  }

  // Store member management methods
  async addMemberToStore(storeId: string, userEmail: string, owner: IUSER) {
    // Only owner can add members
    const isOwner = await this.checkIsOwner(storeId, owner.id);

    if (!isOwner) {
      throw new ForbiddenError('Only store owner can add members');
    }

    // Check if user exists
    const userExists = await this.prismaService.user.findUnique({
      where: { email: userEmail },
    });

    if (!userExists) {
      throw new ConflictError('User not found');
    }
    const memberExits = await this.prismaService.storeMember.findFirst({
      where: {
        userId: userExists.id,
        storeId: storeId,
      },
    });
    if (memberExits) {
      throw new ConflictError('User already exists in this store');
    }

    return await this.prismaService.storeMember.create({
      data: {
        storeId,
        userId: userExists.id,
        role: StoreMemberRole.MEMBER,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async getMembersInStore(storeId: string, owner: IUSER) {
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError('Only store owner can get members');
    }
    return await this.prismaService.storeMember.findMany({
      where: {
        storeId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(storeId: string, memberUserId: string, owner: IUSER) {
    // Only owner can remove members
    const isOwner = await this.checkIsOwner(storeId, owner.id);

    if (!isOwner) {
      throw new ForbiddenError('Only store owner can remove members');
    }
    const userExists = await this.prismaService.user.findUnique({
      where: { id: memberUserId },
    });
    if (!userExists) {
      throw new NotFoundError('Member not found in this store');
    }

    return await this.prismaService.storeMember.delete({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
    });
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
