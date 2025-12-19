import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, stock_movement_type } from '@prisma/client';

@Injectable()
export class StockMovementService {
  private readonly errorMessages = {
    //Stock_movement Management
    QUANTITY_NON_ZERO_NUMBER: 'Delta must be a non-zero number',
    STOCK_MOVEMENT_NOT_FOUND: 'Stock movement not found',
    NO_STOCK_MOVEMENT_FOUND_IN_STORE: 'No stock movements found for this store',

    //Product Management
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_NOT_FOUND_OR_NOT_ACTIVE: 'Product not found or not active',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',

    // Inventory Management
    INVENTORY_NOT_FOUND: 'Inventory not found',

    // Authorization
    ONLY_STORE_OWNER_CAN_ADJUST: 'Only the store owner can adjust inventory',
    USER_NOT_IN_STORE: 'Only user in store can do this actions',
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(
    variant_id: string,
    type: stock_movement_type,
    quantity: number,
    tx: Prisma.TransactionClient | PrismaService,
  ) {
    const client = tx ?? this.prisma;

    const stockMovement = await client.stockMovement.create({
      data: {
        variant_id: variant_id,
        type: type,
        quantity: quantity,
      },
    });
    return stockMovement;
  }

  async findAll(store_id: string, query: Prisma.StockMovementFindManyArgs) {
    const where: Prisma.StockMovementWhereInput = {
      AND: [query.where ?? {}],
      variants: {
        product: {
          store_id: store_id,
        },
      },
    };

    const [stock_movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              sku: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({
        where,
      }),
    ]);
    return {
      data: stock_movements,
      total,
    };
  }

  async findOne(product_id: string, id: string) {
    const existing = await this.prisma.stockMovement.findUnique({
      where: {
        id,
        variants: {
          product_id,
        },
      },
    });
    if (!existing)
      throw new NotFoundError(this.errorMessages.STOCK_MOVEMENT_NOT_FOUND);
    return existing;
  }
}
