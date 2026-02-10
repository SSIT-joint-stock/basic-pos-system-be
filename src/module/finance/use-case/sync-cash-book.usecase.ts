import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CalculateCashBookUseCase } from './calculate-cash-book.usecase';

/**
 * UseCase: Đồng bộ sổ quỹ cho một hoặc nhiều ngày
 * Gọi CalculateCashBookUseCase để tính toán lại số dư
 */
@Injectable()
export class SyncCashBookUseCase {
  constructor(
    private readonly calculateCashBookUseCase: CalculateCashBookUseCase,
  ) {}

  /**
   * Đồng bộ sổ quỹ cho một ngày cụ thể
   * @param storeId - ID cửa hàng
   * @param date - Ngày cần đồng bộ
   */
  async syncForDate(
    storeId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.calculateCashBookUseCase.calculateForDate(storeId, date, tx);
  }

  /**
   * Đồng bộ sổ quỹ cho khoảng thời gian
   * @param storeId - ID cửa hàng
   * @param fromDate - Từ ngày
   * @param toDate - Đến ngày
   */
  async syncForDateRange(
    storeId: string,
    fromDate: Date,
    toDate: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      await this.calculateCashBookUseCase.calculateForDate(
        storeId,
        new Date(currentDate),
        tx,
      );

      // Tăng 1 ngày
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
}
