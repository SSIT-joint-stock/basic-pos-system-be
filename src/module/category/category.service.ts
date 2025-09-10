import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { ConflictError, NotFoundError } from 'app/common/response';

@Injectable()
export class CategoryService {
  private readonly errorMessages = {
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_ALREADY_EXISTS: 'Category already exists',
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

  findAll(storeId: string) {
    return this.prismaService.category.findMany({
      where: {
        store_id: storeId,
      },
    });
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
