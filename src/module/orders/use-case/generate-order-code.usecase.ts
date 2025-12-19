import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';

export interface IGenerateCodeUseCase {
  generateOrderCodeBatch(storeId: string, count: number): Promise<string[]>;
  generateOrderCode(storeId: string): Promise<string>;
}
@Injectable()
export class GenerateOrderCodeUseCase implements IGenerateCodeUseCase {
  private prefix = 'DH';
  private padLength = 5;
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate multiple unique order codes for a batch of orders
   * EX: DH00001, DH00002
   * @param {string} storeId - The ID of the store
   * @param {number} count - The number of order codes to generate
   * @returns {Promise<string[]>} - An array of unique order codes
   */

  async generateOrderCodeBatch(
    storeId: string,
    count: number,
  ): Promise<string[]> {
    const lastOrderCode = await this.prisma.order.findFirst({
      where: {
        store_id: storeId,
        code: {
          startsWith: this.prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });
    const startNum =
      lastOrderCode && lastOrderCode.code
        ? parseInt(lastOrderCode.code.slice(this.prefix.length)) + 1
        : 1;
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = `${this.prefix}${(startNum + i)
        .toString()
        .padStart(this.padLength, '0')}`;
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate a single unique order code
   * EX: DH00001
   */

  async generateOrderCode(storeId: string): Promise<string> {
    const codes = await this.generateOrderCodeBatch(storeId, 1);
    return codes[0];
  }
}
