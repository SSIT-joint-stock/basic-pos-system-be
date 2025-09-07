/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';

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
  ) {
    // 1) Pre-check unique
    const exists = await this.prisma.product.findFirst({
      where: {
        sku: data.sku,
        store_id: data.store_id,
      },
    });

    if (exists) {
      throw new BadRequestError(this.errorMessages.PRODUCT_SKU_EXISTS);
    }

    // 2) FK checks
    const store = await this.prisma.store.findUnique({
      where: { id: data.store_id },
    });
    if (!store) {
      throw new NotFoundError(this.errorMessages.STORE_NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.created_by },
    });
    if (!user) {
      throw new NotFoundError(this.errorMessages.USER_NOT_FOUND);
    }

    // 3) Create + default inventory
    const created = await this.prisma.product.create({
      data: {
        ...data,
        inventories: { create: {} },
      },
    });

    return ApiResponse.success(created, 'Product created successfully');
  }

  async findAll(created_by: string) {
    // 1) Validate input
    if (!created_by) {
      throw new BadRequestError(this.errorMessages.UNAUTHORIZED);
    }

    // 2) Check user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: created_by },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundError(this.errorMessages.USER_NOT_FOUND);
    }

    // 3) Lấy danh sách sản phẩm (trả mảng rỗng nếu không có)
    const products = await this.prisma.product.findMany({
      where: { created_by },
      orderBy: { createdAt: 'desc' },
      // select: {...} // TODO nếu muốn giới hạn field trả về
    });

    return ApiResponse.success(products, 'Products fetched successfully');
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
    return ApiResponse.success(product, 'Product fetched successfully');
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
    if (!id) {
      throw new BadRequestError(this.errorMessages.BAD_REQUEST);
    }

    // 1) Lấy product hiện tại để kiểm tra tồn tại + lấy store_id (phục vụ check SKU unique)
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, store_id: true, created_by: true },
    });
    if (!existing) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }

    // TODO Chỉ cho người tạo được update
    // if (actorId !== existing.created_by) throw new ForbiddenError(this.errorMessages.FORBIDDEN);

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
      include: { inventories: true }, // giữ nguyên như bạn ghi chú
    });

    return ApiResponse.success(updated, 'Update product successfully');
  }

  async remove(id: string) {
    // 1. Check product tồn tại
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }

    // 2. Xoá
    await this.prisma.product.delete({ where: { id } });

    // 3. Trả về response chuẩn
    return ApiResponse.success(null, 'Delete product successfully');
  }
}
