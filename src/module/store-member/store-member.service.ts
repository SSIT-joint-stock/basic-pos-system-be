import { Injectable } from '@nestjs/common';
import { IUser } from 'app/common/types/user.type';
import { PrismaService } from 'app/prisma/prisma.service';

import { Prisma, StoreMemberRole } from '@prisma/client';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'app/common/response';
import { UpdateInfoMemberDto } from 'app/module/store-member/dto/update-info-member.dto';
import { AddExistingMemberDto } from './dto/add-existing-member.dto';
import { CreateAndAddMemberDto } from './dto/create-and-add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class StoreMemberService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}
  private readonly errMsg = {
    ONLY_OWNER_CAN_ADD_MEMBER: 'Chỉ chủ cửa hàng mới có quyền thêm thành viên',
    ONLY_OWNER_CAN_REMOVE_MEMBER:
      'Chỉ chủ cửa hàng mới có quyền xoá thành viên',
    ONLY_OWNER_CAN_UPDATE_ROLE:
      'Chỉ chủ cửa hàng mới có quyền cập nhật vai trò thành viên',
    ONLY_OWNER_CAN_UPDATE_INFO:
      'Chỉ chủ cửa hàng mới có quyền cập nhật thông tin thành viên',
    ONLY_OWNER_CAN_VIEW_MEMBERS:
      'Chỉ chủ cửa hàng mới có quyền xem danh sách thành viên',
    ONLY_OWNER_CAN_VIEW_MEMBER_DETAIL:
      'Chỉ chủ cửa hàng mới có quyền xem chi tiết thành viên',

    USER_NOT_EXIST: 'Người dùng không tồn tại',
    USER_NOT_VERIFIED: 'Người dùng chưa xác thực tài khoản',

    MEMBER_ALREADY_EXISTS: 'Người dùng đã là thành viên của cửa hàng',
    MEMBER_NOT_FOUND: 'Không tìm thấy thành viên trong cửa hàng',

    OWNER_CANNOT_ADD_SELF:
      'Chủ cửa hàng không thể tự thêm chính mình làm thành viên',
    OWNER_CANNOT_REMOVE_SELF: 'Không thể xoá chủ cửa hàng khỏi cửa hàng',
    OWNER_ROLE_CANNOT_BE_UPDATED: 'Không thể thay đổi vai trò của chủ cửa hàng',
    OWNER_ROLE_CANNOT_BE_REMOVE: 'Không thể xoá vai trò chủ cửa hàng',

    CANNOT_ASSIGN_OWNER_ROLE: 'Không thể gán vai trò chủ cửa hàng',

    EMAIL_ALREADY_EXISTS: 'Email đã tồn tại trong hệ thống',
    USERNAME_ALREADY_EXISTS: 'Tên đăng nhập đã tồn tại trong hệ thống',
    PASSWORD_CONFIRM_NOT_MATCH: 'Mật khẩu và xác nhận mật khẩu không khớp',
    USER_ALREADY_EXISTS: 'Email hoặc tên đăng nhập đã tồn tại',
  };
  // USER ALWAYS IS SOURCE OF TRUTH
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
        name: user.username,
        email: user.email,
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
        name: user.username,
        email: user.email,
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
  async updateMemberInfo(
    storeId: string,
    memberUserId: string,
    dto: UpdateInfoMemberDto,
    owner: IUser,
  ) {
    // 1. Only store owner can update member role
    const isOwner = await this.checkIsOwner(storeId, owner.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_UPDATE_INFO);
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        id: memberUserId,
      },
    });
    if (!user) {
      throw new NotFoundError(this.errMsg.MEMBER_NOT_FOUND);
    }
    await this.validateUserDoesNotExist(dto.email, dto.username, user.id);
    const updated = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        username: dto.username,
        email: dto.email,
      },
    });

    await this.prismaService.storeMember.update({
      where: {
        storeId_userId: {
          storeId,
          userId: memberUserId,
        },
      },
      data: {
        name: updated.username,
        email: updated.email,
      },
    });
  }

  // get members
  // async getMembers(storeId: string, currentUser: IUser) {
  //   const isOwner = await this.checkIsOwner(storeId, currentUser.id);
  //   if (!isOwner) {
  //     throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_VIEW_MEMBERS);
  //   }

  //   // 2. Get all members in store
  //   const members = await this.prismaService.storeMember.findMany({
  //     where: {
  //       storeId,
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           username: true,
  //           email: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'asc',
  //     },
  //   });

  //   return members;
  // }
  async getMembers(
    store_id: string,
    query: Prisma.StoreMemberFindManyArgs,
    user: IUser,
  ) {
    const isOwner = await this.checkIsOwner(store_id, user.id);
    if (!isOwner) {
      throw new ForbiddenError(this.errMsg.ONLY_OWNER_CAN_VIEW_MEMBERS);
    }
    const where: Prisma.StoreMemberWhereInput = {
      AND: [query.where ?? {}],
    };

    const [memberInfo, total] = await Promise.all([
      this.prismaService.storeMember.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prismaService.storeMember.count({
        where,
      }),
    ]);

    return { data: memberInfo, total };
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

  private async validateUserDoesNotExist(
    email: string,
    username: string,
    id: string,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email }, { username }],
        NOT: { id: id },
      },
    });

    if (user) {
      throw new ConflictError(this.errMsg.USER_ALREADY_EXISTS);
    }
  }
}
