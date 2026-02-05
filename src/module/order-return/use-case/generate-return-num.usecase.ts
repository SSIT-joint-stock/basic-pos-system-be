import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';

export interface IGenerateReturnOrderNumberUseCase {
  generateOrderReturnBatch(storeId: string, count: number): Promise<string[]>;
  generateOrderReturn(storeId: string): Promise<string>;
  generateOrderReturnBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GenerateReturnOrderUseCase
  implements IGenerateReturnOrderNumberUseCase
{
  private prefix = 'THKH';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of products
   * EX: SP00001, SP00002
   */
  async generateOrderReturnBatch(
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await this.prisma.orderReturn.findFirst({
      where: {
        store_id: storeId,
        order_return_number: { startsWith: this.prefix },
      },
      orderBy: { order_return_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.order_return_number
        ? parseInt(
            lastOrderNumber.order_return_number.slice(this.prefix.length),
          ) + 1
        : 1;

    const orderNumbers: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      orderNumbers.push(sku);
    }

    return orderNumbers;
  }

  /**
   * Generate a single unique SKU
   */
  async generateOrderReturn(storeId: string): Promise<string> {
    const orderNumbers = await this.generateOrderReturnBatch(storeId, 1);
    return orderNumbers[0];
  }

  /**
   * Generate SKUs within a Prisma transaction (for batch inserts)
   */
  async generateOrderReturnBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await tx.orderReturn.findFirst({
      where: {
        store_id: storeId,
        order_return_number: { startsWith: this.prefix },
      },
      orderBy: { order_return_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.order_return_number
        ? parseInt(
            lastOrderNumber.order_return_number.slice(this.prefix.length),
          ) + 1
        : 1;

    const orderNumbers: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      orderNumbers.push(sku);
    }

    return orderNumbers;
  }
}
