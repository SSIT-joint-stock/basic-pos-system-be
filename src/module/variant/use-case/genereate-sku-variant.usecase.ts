import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';

export interface IGenerateSkuVariantUseCase {
  generateSkuVariantBatch(storeId: string, count: number): Promise<string[]>;
  generateSkuVariant(storeId: string): Promise<string>;
  generateSkuVariantBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GenerateVariantSkuUseCase implements IGenerateSkuVariantUseCase {
  private prefix = 'BT';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of variants
   * EX: BT00001, BT00002
   */
  async generateSkuVariantBatch(
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const variants = await this.prisma.variant.findMany({
      where: {
        product: { store_id: storeId },
        sku: { startsWith: this.prefix },
      },
      select: { sku: true },
    });

    let maxNumber = 0;
    for (const v of variants) {
      const numPart = parseInt(v.sku.slice(this.prefix.length));
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }

    const startNumber = maxNumber + 1;

    const variantSkus: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      variantSkus.push(sku);
    }

    return variantSkus;
  }

  /**
   * Generate a single unique SKU
   */
  async generateSkuVariant(storeId: string): Promise<string> {
    const variantSkus = await this.generateSkuVariantBatch(storeId, 1);
    return variantSkus[0];
  }

  /**
   * Generate SKUs within a Prisma transaction (for batch inserts)
   */
  async generateSkuVariantBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const variants = await tx.variant.findMany({
      where: {
        product: {
          store_id: storeId,
        },
        sku: { startsWith: this.prefix },
      },
      select: { sku: true },
    });

    let maxNumber = 0;
    for (const v of variants) {
      const numPart = parseInt(v.sku.slice(this.prefix.length));
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }

    const startNumber = maxNumber + 1;

    const skus: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      skus.push(sku);
    }

    return skus;
  }
}
