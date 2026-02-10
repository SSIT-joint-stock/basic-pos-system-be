import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashTransaction, Prisma, transaction_status } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';
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
  async execute(
    id: string,
    cancelledBy: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    // 1. Find transaction
    const transaction = await prisma.cashTransaction.findUnique({
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
    if (transaction.status === transaction_status.CANCELLED) {
      throw new BadRequestException({
        message: 'Giao dịch đã bị hủy trước đó',
        field: 'status',
        value: transaction.status,
      });
    }

    // 3. Cancel transaction
    const cancelledTransaction = await prisma.cashTransaction.update({
      where: { id },
      data: {
        status: transaction_status.CANCELLED,
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
    await this.syncCashBookUseCase
      .syncForDate(transaction.store_id, transaction.transaction_date, tx)
      .catch((error) => {
        console.error('Failed to sync cash book:', error);
      });

    return cancelledTransaction;
  }
}
