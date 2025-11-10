/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  Inventory,
  Prisma,
  Product,
  ProductTemplate,
  stock_movement_type,
} from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import type { IUserWithPermissions } from 'app/common/types/permission.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as XLSX from 'xlsx';
import { generateSku, generateSkuBatch } from 'app/common/helpers/generate-sku';

export type ProductWithInventory = Product & {
  inventory: Inventory | null;
  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
};

export interface CreateProductsBatchResult {
  updatedCount: number;
  createdCount: number;
  updated: ProductWithInventory[];
  created: ProductWithInventory[];
}
import { CreateProductTemplateDto } from './dto/create-product-template-dto';

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
        sku: data.sku || (await generateSku(storeId)),
        store_id: storeId,
      },
    });

    if (exists) {
      throw new BadRequestError(this.errorMessages.PRODUCT_SKU_EXISTS);
    }

    // 2) Create + default inventory
    const { categoryIds, ...res } = data;
    const sku = data.sku || (await generateSku(storeId));
    const created = await this.prisma.product.create({
      data: {
        ...res,
        sku: sku,
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

  async getProductSuggestion(query: Prisma.ProductFindManyArgs) {
    const where: Prisma.ProductWhereInput = {
      AND: [query.where ?? {}],
    };

    const [products, total_product] = await Promise.all([
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
    const templateWhere: Prisma.ProductTemplateWhereInput = {
      // Nếu bạn muốn dùng cùng điều kiện như Product thì cast hoặc tự tạo tương tự
      AND: [(query.where as any) ?? {}], // ép kiểu nhẹ để dùng lại
    };

    const [templates, total_template] = await Promise.all([
      this.prisma.productTemplate.findMany({
        where: templateWhere,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy as any,
      }),
      this.prisma.productTemplate.count({ where: templateWhere }),
    ]);
    const combined = [
      ...products.map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        cost: p.cost,
        image_url: p.image_url,
        source: 'PRODUCT',
        inventory: p.inventory,
        categories: p.categories,
        tags: p.tags,
      })),
      ...templates.map((t) => ({
        id: t.id,
        name: t.name,
        barcode: t.barcode,
        price: (t as any).price ?? null,
        cost: (t as any).cost ?? null,
        image_url: (t as any).image_url ?? null,
        source: 'TEMPLATE',
      })),
    ];

    return { data: combined, total: total_product + total_template };
  }

  async createProductsBatch(
    store_id: string,
    user: IUserWithPermissions,
    items: CreateProductDto[],
  ): Promise<CreateProductsBatchResult> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Items must not be empty');
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const created: ProductWithInventory[] = [];
      const updated: ProductWithInventory[] = [];

      const providedSkus = items
        .filter((item) => item.sku)
        .map((item) => item.sku);

      const existingProducts = await tx.product.findMany({
        where: {
          store_id,
          sku: { in: providedSkus },
        },
        include: {
          inventory: true,
          categories: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true } },
        },
      });

      const existingSkuMap = new Map(existingProducts.map((p) => [p.sku, p]));

      const itemsToUpdate: CreateProductDto[] = [];
      const itemsToCreate: CreateProductDto[] = [];

      for (const item of items) {
        if (item.sku && existingSkuMap.has(item.sku)) {
          itemsToUpdate.push(item);
        } else {
          itemsToCreate.push(item);
        }
      }

      for (const item of itemsToUpdate) {
        const existing = existingSkuMap.get(item.sku);
        if (!existing) continue;

        const qtyToAdd = item.initial_quantity ?? 0;

        if (qtyToAdd > 0 && existing.inventory) {
          await tx.inventory.update({
            where: { id: existing.inventory.id },
            data: {
              quantity: { increment: qtyToAdd },
            },
          });

          await tx.stockMovement.create({
            data: {
              product_id: existing.id,
              type: stock_movement_type.PURCHASE,
              quantity: qtyToAdd,
            },
          });
        }

        await tx.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            price: item.price,
            cost: item.cost,
            barcode: item.barcode,
            description: item.description,

            ...(item.categoryIds && item.categoryIds.length > 0
              ? {
                  categories: {
                    set: item.categoryIds.map((id) => ({ id })),
                  },
                }
              : {}),
          },
        });

        const refreshed = await tx.product.findUnique({
          where: { id: existing.id },
          include: {
            inventory: true,
            categories: { select: { id: true, name: true } },
            tags: { select: { id: true, name: true } },
          },
        });

        if (refreshed) {
          updated.push(refreshed);
        }
      }

      if (itemsToCreate.length > 0) {
        const skus = await generateSkuBatch(tx, store_id, itemsToCreate.length);

        const itemsWithSku = itemsToCreate.map((item, index) => ({
          ...item,
          sku: item.sku || skus[index],
        }));

        const allCategoryIds = new Set<string>();
        for (const item of itemsWithSku) {
          if (item.categoryIds && Array.isArray(item.categoryIds)) {
            item.categoryIds.forEach((id) => {
              if (id?.trim()) allCategoryIds.add(id.trim());
            });
          }
        }

        if (allCategoryIds.size > 0) {
          const existingCategories = await tx.category.findMany({
            where: {
              store_id,
              id: { in: Array.from(allCategoryIds) },
            },
            select: { id: true },
          });

          const existingCategoryIds = new Set(
            existingCategories.map((c) => c.id),
          );
          const invalidCategoryIds = Array.from(allCategoryIds).filter(
            (id) => !existingCategoryIds.has(id),
          );

          if (invalidCategoryIds.length > 0) {
            throw new BadRequestError(
              `Invalid category ids: ${invalidCategoryIds.join(', ')}`,
            );
          }
        }

        for (const productData of itemsWithSku) {
          const initialQty = productData.initial_quantity ?? 0;

          const categoryIds = productData.categoryIds?.filter((id) => id) ?? [];

          const product = await tx.product.create({
            data: {
              name: productData.name,
              sku: productData.sku,
              price: productData.price,
              cost: productData.cost,
              barcode: productData.barcode,
              description: productData.description,
              store_id,
              created_by: user.id,
              inventory: {
                create: {
                  quantity: initialQty,
                },
              },
              categories:
                categoryIds.length > 0
                  ? {
                      connect: categoryIds.map((id) => ({ id })),
                    }
                  : undefined,
            },
            include: {
              inventory: true,
              categories: { select: { id: true, name: true } },
              tags: { select: { id: true, name: true } },
            },
          });

          if (initialQty > 0) {
            await tx.stockMovement.create({
              data: {
                product_id: product.id,
                type: stock_movement_type.PURCHASE,
                quantity: initialQty,
              },
            });
          }

          created.push(product);
        }
      }

      return { created, updated };
    });

    return {
      updatedCount: results.updated.length,
      createdCount: results.created.length,
      updated: results.updated,
      created: results.created,
    };
  }

  async createProductsTemplate(items: CreateProductTemplateDto[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Items must not be empty');
    }

    const payloadBarcodes = items.map((i) => i.barcode?.trim());
    if (payloadBarcodes.length !== items.length) {
      throw new BadRequestError('Every item must have a non-empty barcode');
    }

    //Kiểm tra TRÙNG BARCODE trong batch product
    const duplicates = Object.entries(
      payloadBarcodes.reduce<Record<string, number>>((acc, barcode) => {
        const b = barcode;
        acc[b] = (acc[b] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .filter(([, count]) => count > 1)
      .map(([sku]) => sku);

    if (duplicates.length > 0) {
      throw new BadRequestError(
        `Duplicate barcode found in batch: ${duplicates.join(', ')}`,
      );
    }

    // Lấy danh sách BARCODE đã có trong DB
    const existingProductsTemplate = await this.prisma.productTemplate.findMany(
      {
        where: { barcode: { in: payloadBarcodes } },
      },
    );

    const existingBarcodeSet = new Set(
      existingProductsTemplate.map((p) => p.barcode),
    );
    // Chia nhóm
    const newProducts = items.filter((i) => !existingBarcodeSet.has(i.barcode));
    const updateProducts = items.filter((i) =>
      existingBarcodeSet.has(i.barcode),
    );

    const results = await this.prisma.$transaction(async (tx) => {
      const updated: ProductTemplate[] = [];
      const created: ProductTemplate[] = [];

      // 1. Update sản phẩm có sẵn
      for (const p of updateProducts) {
        const existing = existingProductsTemplate.find(
          (e) => e.barcode === p.barcode,
        );

        if (!existing) continue;

        const refreshed = await tx.productTemplate.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            price: p.price,
            cost: p.cost,
            description: p.description,
            image_url: p.image_url,
            meta: p.meta ?? {},
          },
        });
        if (refreshed) updated.push(refreshed as any);
      }

      // 2. Tạo sản phẩm mới
      for (const p of newProducts) {
        const product = await tx.productTemplate.create({
          data: {
            barcode: p.barcode,
            name: p.name,
            price: p.price,
            cost: p.cost,
            image_url: p.image_url,
            description: p.description,
            meta: p.meta,
          },
        });

        console.log(p);

        created.push(product as any);
      }

      return { updated, created };
    });

    return {
      updatedCount: results.updated.length,
      createdCount: results.created.length,
      updated: results.updated,
      created: results.created,
    };
  }
  // async createProductByExcel(
  //   file: Express.Multer.File,
  //   storeId: string,
  //   userId: string,
  // ) {
  //   if (!file) {
  //     throw new NotFoundError(this.errorMessages.FILE_NOT_FOUND);
  //   }

  //   // Đọc Excel
  //   const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  //   const sheetName = workbook.SheetNames[0];
  //   const sheet = workbook.Sheets[sheetName];
  //   const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

  //   if (jsonData.length === 0) {
  //     throw new BadRequestError(this.errorMessages.FILE_EMPTY);
  //   }
  //   if (jsonData.length >= 500) {
  //     throw new BadRequestError(this.errorMessages.FILE_TOO_LARGE);
  //   }

  //   const result = await this.prisma.$transaction(
  //     async (tx) => {
  //       const createdProducts: Product[] = [];

  //       for (const row of jsonData) {
  //         // Tìm hoặc tạo category theo tên
  //         let category = await tx.category.findFirst({
  //           where: {
  //             store_id: storeId,
  //             name: row['category'],
  //           },
  //         });

  //         if (!category) {
  //           category = await tx.category.create({
  //             data: {
  //               name: row['category'],
  //               store_id: storeId,
  //             },
  //           });
  //         }

  //         // Check product tồn tại
  //         const existingSku = await tx.product.findFirst({
  //           where: {
  //             sku: row['sku'],
  //             store_id: storeId,
  //           },
  //         });
  //         if (existingSku) {
  //           throw new ConflictError(
  //             `Product with sku ${row['sku']} already exists`,
  //           );
  //         }

  //         // Tạo product
  //         const product = await tx.product.create({
  //           data: {
  //             name: row['name'],
  //             sku: row['sku'],
  //             barcode: row['barcode']?.toString(),
  //             price: Number(row['price'] ?? 0),
  //             cost: Number(row['cost'] ?? 0),
  //             description: row['description'],
  //             image_url: row['image_url'],
  //             product_status: row['product_status'] ?? 'ACTIVE',
  //             store_id: storeId,
  //             created_by: userId,
  //             inventory: { create: {} },
  //             categories: {
  //               connect: [{ id: category.id }],
  //             },
  //           },
  //           include: {
  //             categories: true,
  //             inventory: true,
  //           },
  //         });

  //         createdProducts.push(product);
  //       }

  //       return createdProducts;
  //     },
  //     {
  //       timeout: 30000,
  //     },
  //   );

  //   return { data: result };
  // }
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
