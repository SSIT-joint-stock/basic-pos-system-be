import { Prisma, User, user_role, user_status } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { nanoid } from 'nanoid';

export type UserEntity = User;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: { ...dto, password: '', username: dto.username ?? '' },
    });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  countWithCondition(condition: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where: condition });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async generateUsername(email: string): Promise<string> {
    const username = email.split('@')[0];
    const user = await this.findByUsername(username);
    if (user) {
      const randomSuffix = nanoid(4);
      return `${username}_${randomSuffix}`;
    }
    return username;
  }
  async findByEmailOrUsername(emailOrUsername: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        ownedStores: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
        memberships: {
          include: {
            store: {
              include: {
                _count: {
                  select: { members: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            ownedStores: true,
            memberships: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { __raw: true, data: { deleted: true } }; // bypass wrapper → { deleted: true }
    } catch {
      throw new NotFoundException('User not found');
    }
  }
  async createOauthUser(
    user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>,
  ): Promise<UserEntity> {
    return this.prisma.user.create({
      data: user,
    });
  }
  async findAllPaginated(prismaQuery: Prisma.UserFindManyArgs) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany(prismaQuery),
      this.prisma.user.count({ where: prismaQuery.where }),
    ]);
    return { data, total };
  }

  async getStats() {
    const [total, roles, statuses, newToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      this.prisma.user.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.user.count({
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
      byRole: roles.reduce(
        (acc, r) => ({ ...acc, [r.role]: r._count._all }),
        {} as Partial<Record<user_role, number>>,
      ),
      byStatus: statuses.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count._all }),
        {} as Partial<Record<user_status, number>>,
      ),
    };
  }
}
