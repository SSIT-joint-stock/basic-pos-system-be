import { Injectable } from '@nestjs/common';
import { BadRequestError, NotFoundError } from 'app/common/response';
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

    // Authorization
    ONLY_STORE_OWNER_CAN_ADJUST: 'Only the store owner can adjust inventory',
    USER_NOT_IN_STORE: 'Only user in store can do this actions',
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(
    product_id: string,
    type: stock_movement_type,
    quantity: number,
    tx: Prisma.TransactionClient | PrismaService,
  ) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestError(this.errorMessages.QUANTITY_NON_ZERO_NUMBER);
    }

    const client = tx ?? this.prisma;

    const stockMovement = await client.stockMovement.create({
      data: {
        product_id: product_id,
        type: type,
        quantity: quantity,
      },
    });
    return stockMovement;
  }

  async findAll(store_id: string) {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        product: {
          store_id: store_id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (stockMovements.length === 0) {
      throw new NotFoundError(
        this.errorMessages.NO_STOCK_MOVEMENT_FOUND_IN_STORE,
      );
    }
    return stockMovements;
  }

  async findOne(store_id: string, id: string) {
    const existing = await this.prisma.stockMovement.findUnique({
      where: {
        id,
        product: {
          store_id,
        },
      },
    });
    if (!existing)
      throw new NotFoundError(this.errorMessages.STOCK_MOVEMENT_NOT_FOUND);
    return existing;
  }
}
