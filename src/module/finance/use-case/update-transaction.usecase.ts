import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { CashTransaction } from '@prisma/client';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';
import { Decimal } from '@prisma/client/runtime/library';

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
  ): Promise<CashTransaction> {
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

    // 2. Validate can update
    if (transaction.status === 'CANCELLED') {
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

    // 4. Update transaction
    const updatedTransaction = await this.prisma.cashTransaction.update({
      where: { id },
      data: {
        amount: dto.amount ? new Decimal(dto.amount) : undefined,
        payment_method: dto.payment_method,
        transaction_source: dto.transaction_source,
        contact_name: dto.contact_name,
        contact_type: dto.contact_type,
        contact_id: dto.contact_id,
        description: dto.description,
        notes: dto.notes,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
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

    // 5. Re-sync cash book if amount changed
    if (dto.amount !== undefined && transaction.status === 'CONFIRMED') {
      this.syncCashBookUseCase
        .syncForDate(transaction.store_id, transaction.transaction_date)
        .catch((error) => {
          console.error('Failed to sync cash book:', error);
        });
    }

    return updatedTransaction;
  }
}
