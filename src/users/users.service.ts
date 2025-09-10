import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
  async findByEmailOrUsername(emailOrUsername: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
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
}
