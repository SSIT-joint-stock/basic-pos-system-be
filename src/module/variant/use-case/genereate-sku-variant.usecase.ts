import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    const lastVariantSku = await this.prisma.variant.findFirst({
      where: {
        product: { store_id: storeId },
        sku: { startsWith: this.prefix },
      },
      orderBy: { sku: 'desc' },
    });

    const startNumber =
      lastVariantSku && lastVariantSku.sku
        ? parseInt(lastVariantSku.sku.slice(this.prefix.length)) + 1
        : 1;

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
    const lastSku = await tx.variant.findFirst({
      where: {
        product: {
          store_id: storeId,
        },
        sku: { startsWith: this.prefix },
      },
      orderBy: { sku: 'desc' },
    });

    const startNumber =
      lastSku && lastSku.sku
        ? parseInt(lastSku.sku.slice(this.prefix.length)) + 1
        : 1;

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
