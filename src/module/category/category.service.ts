import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { ConflictError, NotFoundError } from 'app/common/response';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  private readonly errorMessages = {
    CATEGORY_NOT_FOUND: 'Danh mục không tồn tại! Vui lòng thử lại',
    CATEGORY_ALREADY_EXISTS: 'Tên danh mục đã tồn tại! Vui lòng thử lại',
  };
  constructor(private readonly prismaService: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto, storeId: string) {
    const existingCategory = await this.prismaService.category.findFirst({
      where: {
        name: createCategoryDto.name,
        store_id: storeId,
      },
    });

    if (existingCategory) {
      throw new ConflictError(this.errorMessages.CATEGORY_ALREADY_EXISTS);
    }
    return await this.prismaService.category.create({
      data: {
        ...createCategoryDto,
        store_id: storeId,
      },
    });
  }

  async findAll(store_id: string, query: Prisma.CategoryFindManyArgs) {
    const where: Prisma.CategoryWhereInput = {
      AND: [query.where ?? {}, { store_id }],
    };

    const [categories, total] = await Promise.all([
      this.prismaService.category.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prismaService.category.count({
        where,
      }),
    ]);

    return { data: categories, total };
  }

  async findOne(id: string, storeId: string) {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!category) {
      throw new NotFoundError(this.errorMessages.CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    storeId: string,
  ) {
    const existingCategory = await this.prismaService.category.findFirst({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!existingCategory) {
      throw new NotFoundError(this.errorMessages.CATEGORY_NOT_FOUND);
    }
    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existingCategory.name
    ) {
      const duplicateCategory = await this.prismaService.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          store_id: storeId,
        },
      });
      if (duplicateCategory) {
        throw new ConflictError(this.errorMessages.CATEGORY_ALREADY_EXISTS);
      }
    }
    return await this.prismaService.category.update({
      where: {
        id,
      },
      data: {
        ...updateCategoryDto,
      },
    });
  }

  async remove(id: string, storeId: string) {
    const existingCategory = await this.prismaService.category.findUnique({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!existingCategory) {
      throw new NotFoundError(this.errorMessages.CATEGORY_NOT_FOUND);
    }
    return await this.prismaService.category.delete({
      where: {
        id,
        store_id: storeId,
      },
    });
  }
}
