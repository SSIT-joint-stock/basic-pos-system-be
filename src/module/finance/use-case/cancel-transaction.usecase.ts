import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CashTransaction } from '@prisma/client';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';

/**
 * UseCase: Hủy giao dịch
 * - Chuyển status thành CANCELLED
 * - Set cancelled_by
 * - Re-sync cash book
 */
@Injectable()
export class CancelTransactionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}

  /**
   * Execute: Hủy giao dịch
   * @param id - ID giao dịch
   * @param cancelledBy - ID người hủy
   * @returns CashTransaction đã hủy
   */
  async execute(id: string, cancelledBy: string): Promise<CashTransaction> {
    // 1. Find transaction
    const transaction = await this.prisma.cashTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException({
        message: 'Không tìm thấy giao dịch',
        field: 'id',
        value: id,
      });
    }

    // 2. Validate can cancel
    if (transaction.status === 'CANCELLED') {
      throw new BadRequestException({
        message: 'Giao dịch đã bị hủy trước đó',
        field: 'status',
        value: transaction.status,
      });
    }

    // 3. Cancel transaction
    const cancelledTransaction = await this.prisma.cashTransaction.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelled_by: cancelledBy,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 4. Re-sync cash book
    this.syncCashBookUseCase
      .syncForDate(transaction.store_id, transaction.transaction_date)
      .catch((error) => {
        console.error('Failed to sync cash book:', error);
      });

    return cancelledTransaction;
  }
}
