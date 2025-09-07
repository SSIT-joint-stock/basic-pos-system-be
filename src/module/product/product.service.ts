/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<
      Prisma.ProductUncheckedCreateInput,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'created_by_user'
      | 'store'
      | 'inventories'
      | 'tags'
      | 'stock_movements'
      | 'order'
      | 'order_item'
    >,
  ): Promise<Product> {
    try {
      const created = await this.prisma.product.create({
        data: {
          ...data,
          inventories: {
            create: {
              /* quantity/discount/total/status dùng default trong schema */
            },
          },
        },
      });
      return created;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            `Unique constraint failed for field(s): ${error.meta?.target ?? 'unknown'}.`,
          );
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Referenced record does not exist (e.g., created_by, store).`,
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`Record not found.`);
        }
      }

      throw new InternalServerErrorException(
        `Failed to create product with default inventory.`,
      );
    }
  }

  async findAll(created_by: string) {
    if (!created_by) {
      throw new BadRequestException('created_by is required');
    }

    const rows = await this.prisma.product.findMany({
      where: { created_by },
      orderBy: { createdAt: 'desc' },
    });

    if (rows.length === 0) {
      throw new NotFoundException(
        'User Id does not exist or this user has no products',
      );
    }

    return rows;
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('Product id is required');
    }

    const found = await this.prisma.product.findUnique({
      where: { id },
      include: { inventories: true, categories: true, tags: true }, // nếu muốn trả kèm quan hệ // FIX co the fix later
    });

    if (!found) {
      throw new NotFoundException('Product Id does not exist');
    }

    return found;
  }

  async update(
    //TODO nho them dieu kien update chi cho nguoi tao
    id: string,
    data: Omit<
      Prisma.ProductUpdateInput,
      | 'id'
      | 'store_id'
      | 'created_by'
      | 'createdAt'
      | 'updatedAt'
      | 'created_by_user'
      | 'store'
      | 'tags'
      | 'stock_movements'
      | 'order'
      | 'order_item'
    >,
  ) {
    try {
      console.log('data', data);
      const udatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...data,
        },
        include: { inventories: true }, // nếu muốn trả kèm quan hệ // FIX co the fix later
      });
      return udatedProduct;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Không tìm thấy record khi update/delete
        if (err.code === 'P2025') {
          throw new NotFoundException(`Product ${id} not found`);
        }
        // Unique constraint (vd: sku trùng)
        if (err.code === 'P2002') {
          throw new ConflictException(`Duplicate value: ${err.meta?.target}`);
        }
        // Foreign key (vd: categoryId/tenantId không tồn tại)
        if (err.code === 'P2003') {
          throw new BadRequestException(
            `Invalid reference (tenantId/categoryId).`,
          );
        }
      }
      throw err; // các lỗi khác giữ nguyên
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    if (!product) {
      throw new NotFoundException('Not found product by Id');
    }
    await this.prisma.product.delete({ where: { id } });
    return 'Deleted successfully';
  }
}
