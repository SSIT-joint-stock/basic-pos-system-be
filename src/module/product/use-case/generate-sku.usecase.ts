import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface IGenerateSkuUseCase {
  generateSkuBatch(storeId: string, count: number): Promise<string[]>;
  generateSku(storeId: string): Promise<string>;
  generateSkuBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GenerateProductSkuUseCase implements IGenerateSkuUseCase {
  private prefix = 'SP';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of products
   * EX: SP00001, SP00002
   */
  async generateSkuBatch(storeId: string, count: number): Promise<string[]> {
    const lastSku = await this.prisma.product.findFirst({
      where: { store_id: storeId, sku: { startsWith: this.prefix } },
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

  /**
   * Generate a single unique SKU
   */
  async generateSku(storeId: string): Promise<string> {
    const skus = await this.generateSkuBatch(storeId, 1);
    return skus[0];
  }

  /**
   * Generate SKUs within a Prisma transaction (for batch inserts)
   */
  async generateSkuBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastSku = await tx.product.findFirst({
      where: { store_id: storeId, sku: { startsWith: this.prefix } },
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
