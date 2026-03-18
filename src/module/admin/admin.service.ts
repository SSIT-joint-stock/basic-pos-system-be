import { Injectable } from '@nestjs/common';
import { user_role, user_status } from '@prisma/client';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminChangePasswordDto } from './dto/change-password.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

import { IUser } from 'app/common/types/user.type';
import { UsersService } from 'app/module/users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
    private readonly bcryptService: BcryptService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.userService.findByEmailOrUsername(
      dto.usernameOrEmail,
    );

    if (!user || user.role !== user_role.ADMIN) {
      throw new NotFoundError('Tài khoản admin không tồn tại');
    }

    if (!user.password) {
      throw new ValidationError(
        'Tài khoản không hỗ trợ đăng nhập bằng mật khẩu',
      );
    }

    const isPasswordValid = await this.bcryptService.comparePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ValidationError('Mật khẩu không chính xác');
    }

    if (user.status !== user_status.ACTIVE) {
      throw new ForbiddenError('Tài khoản đã bị khoá');
    }

    const tokens = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      username: user.username,
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refresh_token: tokens.refresh_token, lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.prismaService.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundError('Không tìm thấy thông tin admin');
    }

    return admin;
  }

  async updateProfile(adminId: string, dto: UpdateAdminProfileDto) {
    if (dto.email) {
      const existingUser = await this.prismaService.user.findFirst({
        where: { email: dto.email, NOT: { id: adminId } },
      });
      if (existingUser) {
        throw new ConflictError('Email đã được sử dụng');
      }
    }

    if (dto.username) {
      const existingUser = await this.prismaService.user.findFirst({
        where: { username: dto.username, NOT: { id: adminId } },
      });
      if (existingUser) {
        throw new ConflictError('Tên người dùng đã được sử dụng');
      }
    }

    return await this.prismaService.user.update({
      where: { id: adminId },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(adminId: string, dto: AdminChangePasswordDto) {
    const admin = await this.prismaService.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundError('Không tìm thấy thông tin admin');
    }

    if (!admin.password) {
      throw new ValidationError('Tài khoản không hỗ trợ phương thức này');
    }

    const isOldPasswordValid = await this.bcryptService.comparePassword(
      dto.oldPassword,
      admin.password,
    );

    if (!isOldPasswordValid) {
      throw new ValidationError('Mật khẩu cũ không chính xác');
    }

    const hashedNewPassword = await this.bcryptService.hashPassword(
      dto.newPassword,
    );

    await this.prismaService.user.update({
      where: { id: adminId },
      data: { password: hashedNewPassword, refresh_token: null },
    });
  }

  async logout(adminId: string) {
    await this.prismaService.user.update({
      where: { id: adminId },
      data: { refresh_token: null },
    });
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Phiên đăng nhập đã hết hạn');
    }

    const payload = this.tokenService.verifyRefreshToken(refreshToken) as IUser;
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
        refresh_token: refreshToken,
      },
    });

    if (
      !user ||
      user.role !== user_role.ADMIN ||
      user.status !== user_status.ACTIVE
    ) {
      throw new UnauthorizedError('Phiên đăng nhập không hợp lệ');
    }

    const tokens = this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      username: user.username,
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refresh_token: tokens.refresh_token },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }
}
