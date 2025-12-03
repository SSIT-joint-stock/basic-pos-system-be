import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { StoreService } from '../store/store.service';
import { NotFoundError } from 'app/common/response';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagService {
  private readonly errMsg = {
    TAG_NOT_FOUND: 'Thông tin nhãn (tag) không tồn tại!',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: StoreService,
  ) {}
  async create(createTagDto: CreateTagDto, storeId: string) {
    await this.store.checkStore(storeId);
    return await this.prisma.tag.create({
      data: {
        ...createTagDto,
        store_id: storeId,
      },
    });
  }

  async findAll(query: Prisma.TagFindManyArgs, storeId: string) {
    await this.store.checkStore(storeId);
    const where: Prisma.TagWhereInput = {
      AND: [query.where ?? {}, { store_id: storeId }],
    };

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.tag.count({
        where,
      }),
    ]);

    return { tags, total };
  }

  async findOne(id: string, storeId: string) {
    await this.store.checkStore(storeId);
    return await this.checkTag(id, storeId);
  }

  async update(id: string, storeId: string, dto: UpdateTagDto) {
    await this.store.checkStore(storeId);
    await this.checkTag(id, storeId);
    return this.prisma.tag.update({
      where: {
        id,
        store_id: storeId,
      },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string, storeId: string) {
    await this.store.checkStore(storeId);
    await this.checkTag(id, storeId);
    return this.prisma.tag.delete({
      where: {
        id,
        store_id: storeId,
      },
    });
  }

  private async checkTag(id: string, storeId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!tag) {
      throw new NotFoundError(this.errMsg.TAG_NOT_FOUND);
    }
    return tag;
  }
}
