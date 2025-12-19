import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface IGenerateCodeSupplierUseCase {
  generateCodeBatch(storeId: string, count: number): Promise<string[]>;
  generateCode(storeId: string): Promise<string>;
  generateCodeBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]>;
}

@Injectable()
export class GenerateCodeSupplier implements IGenerateCodeSupplierUseCase {
  private prefix = 'NCC';
  private padLength = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique SKUs for a batch of products
   * EX: SP00001, SP00002
   */
  async generateCodeBatch(storeId: string, count: number): Promise<string[]> {
    const lasCode = await this.prisma.supplier.findFirst({
      where: { store_id: storeId, code: { startsWith: this.prefix } },
      orderBy: { code: 'desc' },
    });

    const startNumber =
      lasCode && lasCode.code
        ? parseInt(lasCode.code.slice(this.prefix.length)) + 1
        : 1;

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      codes.push(sku);
    }

    return codes;
  }

  /**
   * Generate a single unique SKU
   */
  async generateCode(storeId: string): Promise<string> {
    const codes = await this.generateCodeBatch(storeId, 1);
    return codes[0];
  }

  /**
   * Generate COdes within a Prisma transaction (for batch inserts)
   */
  async generateCodeBatchWithTransaction(
    tx: Prisma.TransactionClient,
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lasCode = await tx.supplier.findFirst({
      where: { store_id: storeId, code: { startsWith: this.prefix } },
      orderBy: { code: 'desc' },
    });

    const startNumber =
      lasCode && lasCode.code
        ? parseInt(lasCode.code.slice(this.prefix.length)) + 1
        : 1;

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const sku = `${this.prefix}${(startNumber + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      codes.push(sku);
    }

    return codes;
  }
}
