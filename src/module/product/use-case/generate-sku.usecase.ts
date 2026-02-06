import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';

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
    // Tìm tất cả SKU của store này để tính toán số lớn nhất chính xác (tránh lỗi alphabetical sort)
    const products = await this.prisma.product.findMany({
      where: { store_id: storeId, sku: { startsWith: this.prefix } },
      select: { sku: true },
    });

    let maxNumber = 0;
    for (const p of products) {
      const numPart = parseInt(p.sku.slice(this.prefix.length));
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
    const products = await tx.product.findMany({
      where: { store_id: storeId, sku: { startsWith: this.prefix } },
      select: { sku: true },
    });

    let maxNumber = 0;
    for (const p of products) {
      const numPart = parseInt(p.sku.slice(this.prefix.length));
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
