import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface IGenerateOrderNumberUseCase {
  generateOrderNumberBatch(storeId: string, count: number): Promise<string[]>;
  generateOrderNumber(storeId: string): Promise<string>;
  generateOrderNumberBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GeneratePurchaseCodeUseCase
  implements IGenerateOrderNumberUseCase
{
  private prefix = 'DNH';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of products
   * EX: SP00001, SP00002
   */
  async generateOrderNumberBatch(
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await this.prisma.purchaseOrder.findFirst({
      where: { store_id: storeId, order_number: { startsWith: this.prefix } },
      orderBy: { order_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.order_number
        ? parseInt(lastOrderNumber.order_number.slice(this.prefix.length)) + 1
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
  async generateOrderNumber(storeId: string): Promise<string> {
    const orderNumbers = await this.generateOrderNumberBatch(storeId, 1);
    return orderNumbers[0];
  }

  /**
   * Generate SKUs within a Prisma transaction (for batch inserts)
   */
  async generateOrderNumberBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await tx.purchaseOrder.findFirst({
      where: { store_id: storeId, order_number: { startsWith: this.prefix } },
      orderBy: { order_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.order_number
        ? parseInt(lastOrderNumber.order_number.slice(this.prefix.length)) + 1
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
