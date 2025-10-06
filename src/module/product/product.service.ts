/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Response } from 'express';
import * as XLSX from 'xlsx';

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

    // File
    FILE_NOT_FOUND: 'File not found',
    FILE_EMPTY: 'File is empty',
    FILE_TOO_LARGE: 'File size is too large, maximum allowed is 500 rows',
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: IUserWithPermissions,
    storeId: string,
    data: CreateProductDto,
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
    const { categoryIds, ...res } = data;
    const created = await this.prisma.product.create({
      data: {
        ...res,
        store_id: storeId,
        created_by: user.id,
        inventory: { create: {} },
        categories: categoryIds?.length
          ? {
              connect: categoryIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        inventory: true,
        categories: true,
        // tags: true,
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
        include: {
          inventory: {
            select: { quantity: true, id: true },
          },
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
        inventory: true,
        categories: true,
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  async update(storeId: string, id: string, data: UpdateProductDto) {
    // 1) Lấy product hiện tại để kiểm tra tồn tại
    const existing = await this.prisma.product.findUnique({
      where: { store_id: storeId, id },
      include: {
        inventory: {
          select: {
            quantity: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        },
      },
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
    const { categoryIds, ...res } = data;
    // 3) Thực hiện update
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...res,
        categories:
          categoryIds !== undefined
            ? {
                set: categoryIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: { inventory: true, categories: true, tags: true }, // FIX: Sau co the bo
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

  async filterProducts(store_id: string, query: Prisma.ProductFindManyArgs) {
    // TODO: chua co meta
    const where: Prisma.ProductWhereInput = {
      AND: [query.where ?? {}, { store_id }],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          inventory: {
            select: { quantity: true },
          },
          categories: true,
          tags: true,
        },
      }),
      this.prisma.product.count({
        where,
      }),
    ]);

    return { data: products, total };
  }
  async createProductByExcel(
    file: Express.Multer.File,
    storeId: string,
    userId: string,
  ) {
    if (!file) {
      throw new NotFoundError(this.errorMessages.FILE_NOT_FOUND);
    }

    // Đọc Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      throw new BadRequestError(this.errorMessages.FILE_EMPTY);
    }
    if (jsonData.length >= 500) {
      throw new BadRequestError(this.errorMessages.FILE_TOO_LARGE);
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const createdProducts: Product[] = [];

        for (const row of jsonData) {
          // Tìm hoặc tạo category theo tên
          let category = await tx.category.findFirst({
            where: {
              store_id: storeId,
              name: row['category'],
            },
          });

          if (!category) {
            category = await tx.category.create({
              data: {
                name: row['category'],
                store_id: storeId,
              },
            });
          }

          // Check product tồn tại
          const existingSku = await tx.product.findFirst({
            where: {
              sku: row['sku'],
              store_id: storeId,
            },
          });
          if (existingSku) {
            throw new ConflictError(
              `Product with sku ${row['sku']} already exists`,
            );
          }

          // Tạo product
          const product = await tx.product.create({
            data: {
              name: row['name'],
              sku: row['sku'],
              barcode: row['barcode']?.toString(),
              price: Number(row['price'] ?? 0),
              cost: Number(row['cost'] ?? 0),
              description: row['description'],
              image_url: row['image_url'],
              product_status: row['product_status'] ?? 'ACTIVE',
              store_id: storeId,
              created_by: userId,
              inventory: { create: {} },
              categories: {
                connect: [{ id: category.id }],
              },
            },
            include: {
              categories: true,
              inventory: true,
            },
          });

          createdProducts.push(product);
        }

        return createdProducts;
      },
      {
        timeout: 30000,
      },
    );

    return { data: result };
  }
  downloadExampleExcel(): StreamableFile {
    const headers = [
      'name*',
      'sku*',
      'barcode',
      'price*',
      'cost',
      'description',
      'image_url',
      'product_status',
      'category*',
    ];
    const sample = [
      {
        'name*': 'Sample Product',
        'sku*': 'SKU001',
        barcode: '123456789',
        'price*': 10000,
        cost: 8000,
        description: 'This is a sample product',
        image_url: 'http://example.com/image.jpg',
        product_status: 'ACTIVE',
        'category*': 'Sample Category',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new StreamableFile(buffer, {
      disposition: 'attachment; filename="example_products.xlsx"',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
