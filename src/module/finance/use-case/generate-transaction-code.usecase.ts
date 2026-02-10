import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { transaction_type } from '@prisma/client';

/**
 * UseCase: Generate mã phiếu thu/chi tự động
 * - Phiếu thu: PT00001, PT00002, PT00003...
 * - Phiếu chi: PC00001, PC00002, PC00003...
 */
@Injectable()
export class GenerateTransactionCodeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate mã giao dịch theo loại
   * @param storeId - ID cửa hàng
   * @param type - Loại giao dịch (RECEIPT hoặc PAYMENT)
   * @returns Mã giao dịch (VD: PT00001)
   */
  async generateCode(storeId: string, type: transaction_type): Promise<string> {
    const prefix = type === 'RECEIPT' ? 'PT' : 'PC';
    const padLength = 5;

    // Tìm giao dịch cuối cùng của cửa hàng với type này
    const lastTransaction = await this.prisma.cashTransaction.findFirst({
      where: {
        store_id: storeId,
        transaction_type: type,
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    // Tính số thứ tự tiếp theo
    const nextNum =
      lastTransaction && lastTransaction.code
        ? parseInt(lastTransaction.code.slice(prefix.length)) + 1
        : 1;

    // Format: PT00001, PC00001
    return `${prefix}${nextNum.toString().padStart(padLength, '0')}`;
  }

  /**
   * Generate mã phiếu thu (PT)
   * @param storeId - ID cửa hàng
   * @returns Mã phiếu thu (VD: PT00001)
   */
  async generateReceiptCode(storeId: string): Promise<string> {
    return this.generateCode(storeId, 'RECEIPT');
  }

  /**
   * Generate mã phiếu chi (PC)
   * @param storeId - ID cửa hàng
   * @returns Mã phiếu chi (VD: PC00001)
   */
  async generatePaymentCode(storeId: string): Promise<string> {
    return this.generateCode(storeId, 'PAYMENT');
  }
}
