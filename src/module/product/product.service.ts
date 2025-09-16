/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { FilterProductsDto } from './dto/filter-product.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  private readonly errorMessages = {
    // User Management
    USER_NOT_FOUND: 'User not found',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    USERNAME_ALREADY_EXISTS: 'Username is already taken',

    // Product Management
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_SKU_EXISTS: 'A product with this SKU already exists',
    PRODUCT_BARCODE_EXISTS: 'A product with this barcode already exists',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',
    STORE_ALREADY_EXISTS: 'Store with this name already exists',

    // Inventory Management
    INVENTORY_NOT_FOUND: 'Inventory not found',
    INSUFFICIENT_STOCK: 'Insufficient stock for this operation',

    // Order Management
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_ALREADY_CANCELLED: 'Order has already been cancelled',
    ORDER_CANNOT_BE_UPDATED: 'Order cannot be updated in its current status',

    // General
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Invalid request data',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: IUserWithPermissions,
    storeId: string,
    data: Omit<
      Prisma.ProductUncheckedCreateInput,
      | 'id'
      | 'store_id'
      | 'createdAt'
      | 'updatedAt'
      | 'created_by_user'
      | 'store'
      | 'inventories'
      | 'tags'
      | 'stock_movements'
      | 'order'
      | 'order_item'
      | 'created_by'
    >,
  ) {
    // 1) Pre-check unique
    const exists = await this.prisma.product.findFirst({
      where: {
        sku: data.sku,
        store_id: storeId,
      },
    });

    if (exists) {
      throw new BadRequestError(this.errorMessages.PRODUCT_SKU_EXISTS);
    }

    // 2) Create + default inventory
    const created = await this.prisma.product.create({
      data: {
        ...data,
        store_id: storeId,
        created_by: user.id,
        inventories: { create: {} },
      },
    });
    return created;
  }

  async findAll(storeId: string, query: Prisma.ProductFindManyArgs) {
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          ...(query.where ?? {}),
          store_id: storeId,
        },
      }),
      this.prisma.product.count({
        where: {
          ...(query.where ?? {}),
          store_id: storeId,
        },
      }),
    ]);
    return {
      data: products,
      total,
    };
  }

  async findOne(storeId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { store_id: storeId, id },
      include: {
        // nếu muốn trả kèm quan hệ // FIX co the fix later
        inventories: true,
        categories: true,
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  async update(
    storeId: string,
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
    // 1) Lấy product hiện tại để kiểm tra tồn tại
    const existing = await this.prisma.product.findUnique({
      where: { store_id: storeId, id },
    });
    if (!existing) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }

    // 2) Nếu có cập nhật SKU thì check unique theo (store_id, sku)
    const nextSku = (data as any)?.sku as string | undefined;
    if (nextSku) {
      const duplicated = await this.prisma.product.findFirst({
        where: {
          store_id: existing.store_id,
          sku: nextSku,
          id: { not: id },
        },
        select: { id: true },
      });
      if (duplicated) {
        throw new ConflictError(this.errorMessages.PRODUCT_SKU_EXISTS);
      }
    }

    // 3) Thực hiện update
    const updated = await this.prisma.product.update({
      where: { id },
      data: { ...data },
      include: { inventories: true }, // FIX: Sau co the bo
    });
    return updated;
  }

  async remove(storeId: string, id: string) {
    // 1. Check product tồn tại
    const product = await this.prisma.product.findUnique({
      where: { store_id: storeId, id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }

    // 2. Xoá
    await this.prisma.product.delete({ where: { id } });
  }

  async filterProducts(
    store_id: string,
    data: FilterProductsDto,
    query: Prisma.ProductFindManyArgs,
  ) {
    // TODO: chua co meta
    const where: Prisma.ProductWhereInput = {
      AND: [
        query.where ?? {},
        { store_id },
        data.sku ? { sku: data.sku } : {},
        data.barcode ? { barcode: data.barcode } : {},
        data.min_price ? { price: { gte: data.min_price } } : {},
        data.max_price ? { price: { lte: data.max_price } } : {},
        data.min_cost ? { cost: { gte: data.min_cost } } : {},
        data.max_cost ? { cost: { lte: data.max_cost } } : {},
        data.image_url ? { image_url: data.image_url } : {},
        data.product_status ? { product_status: data.product_status } : {},
        data.q
          ? {
              OR: [
                { name: { contains: data.q, mode: 'insensitive' } },
                { description: { contains: data.q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.product.count({
        where,
      }),
    ]);

    return { data: products, total };
  }
}
