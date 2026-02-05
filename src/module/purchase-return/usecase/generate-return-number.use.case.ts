import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';

export interface IGenerateNumberReturnUseCase {
  generateNumberReturnBatch(storeId: string, count: number): Promise<string[]>;
  generateNumberReturn(storeId: string): Promise<string>;
  generateNumberReturnBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GeneratePurchaseReturnNumberUseCase
  implements IGenerateNumberReturnUseCase
{
  private prefix = 'DTHNCC';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of products
   * EX: SP00001, SP00002
   */
  async generateNumberReturnBatch(
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await this.prisma.purchaseReturn.findFirst({
      where: { store_id: storeId, return_number: { startsWith: this.prefix } },
      orderBy: { return_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.return_number
        ? parseInt(lastOrderNumber.return_number.slice(this.prefix.length)) + 1
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
  async generateNumberReturn(storeId: string): Promise<string> {
    const orderNumbers = await this.generateNumberReturnBatch(storeId, 1);
    return orderNumbers[0];
  }

  /**
   * Generate SKUs within a Prisma transaction (for batch inserts)
   */
  async generateNumberReturnBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderNumber = await tx.purchaseReturn.findFirst({
      where: { store_id: storeId, return_number: { startsWith: this.prefix } },
      orderBy: { return_number: 'desc' },
    });

    const startNumber =
      lastOrderNumber && lastOrderNumber.return_number
        ? parseInt(lastOrderNumber.return_number.slice(this.prefix.length)) + 1
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
