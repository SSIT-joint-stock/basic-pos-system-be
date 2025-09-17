import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
