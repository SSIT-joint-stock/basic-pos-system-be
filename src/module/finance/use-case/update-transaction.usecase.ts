import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashTransaction, Prisma, transaction_status } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'app/prisma/prisma.service';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';

/**
 * UseCase: Cập nhật giao dịch
 * - Chỉ cho phép update giao dịch ở trạng thái PENDING hoặc CONFIRMED
 * - Không cho phép update giao dịch đã CANCELLED
 * - Nếu update amount hoặc date, cần re-sync cash book
 */
@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}

  /**
   * Execute: Cập nhật giao dịch
   * @param id - ID giao dịch
   * @param dto - UpdateTransactionDto
   * @returns CashTransaction đã update
   */
  async execute(
    id: string,
    dto: UpdateTransactionDto,
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

    // 2. Validate can update
    if (transaction.status === transaction_status.CANCELLED) {
      throw new BadRequestException({
        message: 'Không thể cập nhật giao dịch đã bị hủy',
        field: 'status',
        value: transaction.status,
      });
    }

    // 3. Validate amount if provided
    if (dto.amount !== undefined && dto.amount <= 0) {
      throw new BadRequestException({
        message: 'Số tiền phải lớn hơn 0',
        field: 'amount',
        value: dto.amount,
      });
    }

    // 5. Build update data - Only update fields that are provided
    const updateData: any = {
      ...(dto.amount !== undefined && { amount: new Decimal(dto.amount) }),
      ...(dto.payment_method && { payment_method: dto.payment_method }),
      ...(dto.transaction_source && {
        transaction_source: dto.transaction_source,
      }),
      ...(dto.contact_type !== undefined && {
        contact_type: dto.contact_type,
      }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };

    // 6. Update transaction
    const updatedTransaction = await prisma.cashTransaction.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 7. Re-sync cash book if amount changed and transaction is confirmed
    if (
      dto.amount !== undefined &&
      transaction.status === transaction_status.CONFIRMED
    ) {
      await this.syncCashBookUseCase
        .syncForDate(transaction.store_id, transaction.transaction_date, tx)
        .catch((error: Error) => {
          console.error('Failed to sync cash book:', error);
        });
    }

    return updatedTransaction;
  }
}
