import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { IUSER } from 'app/auth/token.service';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createStoreDto: CreateStoreDto, user: IUSER) {
    await this.prismaService.store.create({
      data: {
        ...createStoreDto,
        owner_id: user.id,
      },
    });
  }

  async findAll(user: IUSER) {
    return await this.prismaService.store.findMany({
      where: {
        owner_id: user.id,
      },
    });
  }

  async findOne(id: string, user: IUSER) {
    await this.prismaService.store.findFirst({
      where: {
        id,
        owner_id: user.id,
      },
    });
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, user: IUSER) {
    await this.prismaService.store.update({
      where: {
        id,
        owner_id: user.id,
      },
      data: {
        ...updateStoreDto,
      },
    });
  }

  async remove(id: string, user: IUSER) {
    await this.prismaService.store.delete({
      where: {
        id,
        owner_id: user.id,
      },
    });
  }
}
