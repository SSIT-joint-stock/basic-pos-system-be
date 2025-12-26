import { PrismaService } from 'app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { IUser } from 'app/common/types/user.type';

import { StoreMemberRole } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'app/common/response';
import { CreateAndAddMemberDto } from './dto/create-and-add-member.dto';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AddExistingMemberDto } from './dto/add-existing-member.dto';

@Injectable()
export class StoreMemberService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}
  private readonly errMsg = {
    ONLY_OWNER_CAN_ADD_MEMBER: 'Only store owner can add members',
    ONLY_OWNER_CAN_REMOVE_MEMBER: 'Only store owner can remove members',
    ONLY_OWNER_CAN_UPDATE_ROLE: 'Only store owner can update member role',
    ONLY_OWNER_CAN_VIEW_MEMBERS: 'Only store owner can view members',
    ONLY_OWNER_CAN_VIEW_MEMBER_DETAIL:
      'Only store owner can view member detail',

    USER_NOT_EXIST: 'User does not exist',
    USER_NOT_VERIFIED: 'User is not verified',

    MEMBER_ALREADY_EXISTS: 'User already exists in this store',
    MEMBER_NOT_FOUND: 'Member not found in this store',

    OWNER_CANNOT_ADD_SELF: 'Owner cannot be added as a member',
    OWNER_CANNOT_REMOVE_SELF: 'Owner cannot be removed from the store',
    OWNER_ROLE_CANNOT_BE_UPDATED: 'Owner role cannot be updated',
    OWNER_ROLE_CANNOT_BE_REMOVE: 'Owner role cannot be remove',

    CANNOT_ASSIGN_OWNER_ROLE: 'Cannot assign OWNER role',

    EMAIL_ALREADY_EXISTS: 'Email already exists',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    PASSWORD_CONFIRM_NOT_MATCH: 'Password and confirm password do not match',
  };
  async addExistingUserToStore(
    storeId: string,
    dto: AddExistingMemberDto,
    owner: IUser,
  ) {
    // 1. Only store owner can add members
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_ADD_MEMBER);
    }

    // 2. Check user exists by email
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ConflictError(this.errMsg.USER_NOT_EXIST);
    }

    // 3. Check user verified
    if (!user.is_verified) {
      throw new ForbiddenError(this.errMsg.USER_NOT_VERIFIED);
    }

    // 4. Owner cannot add himself
    if (user.id === owner.id) {
      throw new ConflictError(this.errMsg.OWNER_CANNOT_ADD_SELF);
    }

    // 5. Check member already exists in store (COMPOSITE KEY)
    const existingMember = await this.prismaService.storeMember.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError(this.errMsg.MEMBER_ALREADY_EXISTS);
    }

    // 6. Create store member
    return this.prismaService.storeMember.create({
      data: {
        storeId,
        userId: user.id,
        role: StoreMemberRole.MEMBER,
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
  // create and addd member
  async createAndAddMember(
    storeId: string,
    dto: CreateAndAddMemberDto,
    owner: IUser,
  ) {
    // 1. Only store owner can create & add member
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_ADD_MEMBER);
    }

    // 2. Validate password confirm
    if (dto.password !== dto.confirmPassword) {
      throw new ConflictError(this.errMsg.PASSWORD_CONFIRM_NOT_MATCH);
    }

    // 3. Check email already exists
    const existingUserByEmail = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUserByEmail) {
      throw new ConflictError(this.errMsg.EMAIL_ALREADY_EXISTS);
    }

    // 4. Check username already exists
    const existingUserByUsername = await this.prismaService.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUserByUsername) {
      throw new ConflictError(this.errMsg.USERNAME_ALREADY_EXISTS);
    }

    // 5. Hash password (reuse service như auth)
    const hashedPassword = await this.bcryptService.hashPassword(dto.password);

    // 6. Create user (OWNER tạo → auto verify)
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        is_verified: true,
      },
    });

    // 7. Safety: owner cannot add himself
    if (user.id === owner.id) {
      throw new ConflictError(this.errMsg.OWNER_CANNOT_ADD_SELF);
    }

    // 8. Create store member
    return this.prismaService.storeMember.create({
      data: {
        storeId,
        userId: user.id,
        role: StoreMemberRole.MEMBER,
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
  async updateMemberRole(
    storeId: string,
    memberUserId: string,
    dto: UpdateMemberRoleDto,
    owner: IUser,
  ) {
    // 1. Only store owner can update member role
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_UPDATE_ROLE);
    }

    // 2. Owner cannot update his own role
    if (memberUserId === owner.id) {
      throw new ConflictError(this.errMsg.OWNER_ROLE_CANNOT_BE_UPDATED);
    }

    // 3. Do not allow assigning OWNER role
    if (dto.role === StoreMemberRole.OWNER) {
      throw new ConflictError(this.errMsg.CANNOT_ASSIGN_OWNER_ROLE);
    }

    // 4. Check member exists in this store
    const member = await this.prismaService.storeMember.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError(this.errMsg.MEMBER_NOT_FOUND);
    }

    // 5. Update role
    return this.prismaService.storeMember.update({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
      data: {
        role: dto.role,
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

  // get members
  async getMembers(storeId: string, currentUser: IUser) {
    const isOwner = await this.checkIsOwner(storeId, currentUser.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_VIEW_MEMBERS);
    }

    // 2. Get all members in store
    const members = await this.prismaService.storeMember.findMany({
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members;
  }
  //get member detail
  async getMemberDetail(storeId: string, memberUserId: string, owner: IUser) {
    // 1. Only store owner can view member detail
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_VIEW_MEMBER_DETAIL);
    }

    // 2. Find member in this store (COMPOSITE KEY)
    const member = await this.prismaService.storeMember.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
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

    if (!member) {
      throw new NotFoundError(this.errMsg.MEMBER_NOT_FOUND);
    }

    return member;
  }

  //remove member
  async removeMember(
    storeId: string,
    memberUserId: string,
    currentUser: IUser,
  ) {
    // 1. Only store owner can remove members
    const isOwner = await this.checkIsOwner(storeId, currentUser.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_REMOVE_MEMBER);
    }

    // 2. Owner cannot remove himself
    if (memberUserId === currentUser.id) {
      throw new ConflictError(this.errMsg.OWNER_ROLE_CANNOT_BE_REMOVE);
    }

    // 3. Check member exists in this store (COMPOSITE KEY)
    const member = await this.prismaService.storeMember.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError(this.errMsg.MEMBER_NOT_FOUND);
    }

    // 4. Remove member
    return this.prismaService.storeMember.delete({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
    });
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
