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

    // 4. Query contact_name if contact_id or contact_type changed
    let contactName = transaction.contact_name; // Keep existing by default
    if (dto.contact_id !== undefined || dto.contact_type !== undefined) {
      const newContactId = dto.contact_id ?? transaction.contact_id;
      const newContactType = dto.contact_type ?? transaction.contact_type;

      // Only query if contact_id is not null
      if (newContactId && newContactType) {
        contactName = await this.getContactName(newContactId, newContactType);
      } else if (newContactType === 'Other') {
        contactName = 'Khác';
      }
    }

    // 5. Build update data - Only update fields that are provided
    const updateData: any = {
      ...(dto.amount !== undefined && { amount: new Decimal(dto.amount) }),
      ...(dto.payment_method && { payment_method: dto.payment_method }),
      ...(dto.transaction_source && {
        transaction_source: dto.transaction_source,
      }),
      ...(dto.contact_id !== undefined && { contact_id: dto.contact_id }),
      ...(dto.contact_type !== undefined && {
        contact_type: dto.contact_type,
      }),
      ...(contactName !== transaction.contact_name && {
        contact_name: contactName,
      }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };

    // 6. Update transaction
    const updatedTransaction = await this.prisma.cashTransaction.update({
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
    if (dto.amount !== undefined && transaction.status === 'CONFIRMED') {
      this.syncCashBookUseCase
        .syncForDate(transaction.store_id, transaction.transaction_date)
        .catch((error: Error) => {
          console.error('Failed to sync cash book:', error);
        });
    }

    return updatedTransaction;
  }

  /**
   * Get contact name from database
   */
  private async getContactName(
    contactId: string,
    contactType: string,
  ): Promise<string> {
    if (contactType === 'Customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: contactId },
        select: { name: true },
      });

      if (!customer) {
        throw new NotFoundException({
          message: 'Không tìm thấy khách hàng',
          field: 'contact_id',
          value: contactId,
        });
      }

      return customer.name;
    } else if (contactType === 'Supplier') {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: contactId },
        select: { name: true },
      });

      if (!supplier) {
        throw new NotFoundException({
          message: 'Không tìm thấy nhà cung cấp',
          field: 'contact_id',
          value: contactId,
        });
      }

      return supplier.name;
    } else {
      return 'Khác';
    }
  }
}
