import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Giả sử PrismaService ở đây
import { User } from '@prisma/client'; // Import từ Prisma client
import { nanoid } from 'nanoid';

export type UserEntity = User;

@Injectable()
export class UserRepository {
  static readonly excludedFields = ['passwordHash'];

  constructor(private readonly prisma: PrismaService) {}

  // Find user by email or username
  async findByEmailOrUsername(identifier: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  // Check if user is active
  // async isActive(id: string): Promise<boolean> {
  //   const user = await this.findById(id);
  //   return user?.isActive ?? false;
  // }

  // Email verification
  // async verifyEmail(id: string): Promise<void> {
  //   await this.update(id, { emailVerified: true });
  // }

  // Activate user
  // async activate(id: string): Promise<void> {
  //   await this.update(id, { isActive: true });
  // }

  // Deactivate user
  // async deactivate(id: string): Promise<void> {
  //   await this.update(id, { isActive: false });
  // }

  // Create user
  async create(
    user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>,
  ): Promise<UserEntity> {
    return this.prisma.user.create({
      data: user,
    });
  }

  // Update user
  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: user,
    });
  }

  // Delete user
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  // Find user by id
  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Find user by providerId
  async findByProviderId(providerId: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: { providerId },
    });
  }

  // // Find user by resetToken
  // async findByResetToken(resetToken: string): Promise<UserEntity | null> {
  //   return this.prisma.user.findFirst({
  //     where: { resetToken },
  //   });
  // }

  // Find user by email
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find user by username
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // Generate username from email
  async generateUsername(email: string): Promise<string> {
    const username = email.split('@')[0];
    const user = await this.findByUsername(username);
    if (user) {
      const randomSuffix = nanoid(4);
      return `${username}_${randomSuffix}`;
    }
    return username;
  }
}
