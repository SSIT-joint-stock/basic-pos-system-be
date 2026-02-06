import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CashTransaction } from '@prisma/client';
import { GenerateTransactionCodeUseCase } from './generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * UseCase: Tạo phiếu chi mới
 * Flow:
 * 1. Validate input
 * 2. Verify store exists
 * 3. Generate payment code (PC00001...)
 * 4. Create transaction
 * 5. Sync cash book
 */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCodeUseCase: GenerateTransactionCodeUseCase,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}

  /**
   * Execute: Tạo phiếu chi
   * @param dto - CreatePaymentDto
   * @returns CashTransaction đã tạo
   */
  async execute(dto: CreatePaymentDto): Promise<CashTransaction> {
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(dto.store_id);

    // 3. Generate payment code
    const code = await this.generateCodeUseCase.generatePaymentCode(
      dto.store_id,
    );

    // 4. Create transaction
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        code,
        store_id: dto.store_id,
        transaction_type: 'PAYMENT',
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type || null,
        contact_id: dto.contact_id || null,
        contact_name: dto.contact_name,

        // Reference info
        reference_type: dto.reference_type || null,
        reference_id: dto.reference_id || null,

        // Description
        description: dto.description,
        notes: dto.notes || null,

        // Status
        status: 'CONFIRMED', // Auto confirm
        transaction_date: new Date(),

        // Audit
        created_by: dto.created_by,
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

    // 5. Sync cash book (async)
    this.syncCashBookUseCase
      .syncForDate(dto.store_id, transaction.transaction_date)
      .catch((error) => {
        console.error('Failed to sync cash book:', error);
      });

    return transaction;
  }

  /**
   * Validate input
   */
  private validateInput(dto: CreatePaymentDto): void {
    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException({
        message: 'Số tiền chi phải lớn hơn 0',
        field: 'amount',
        value: dto.amount,
      });
    }

    // Validate amount max
    const MAX_AMOUNT = 999999999999.99;
    if (dto.amount > MAX_AMOUNT) {
      throw new BadRequestException({
        message: `Số tiền chi không được vượt quá ${MAX_AMOUNT.toLocaleString('vi-VN')} VNĐ`,
        field: 'amount',
        value: dto.amount,
      });
    }

    // Validate contact_name
    if (!dto.contact_name || dto.contact_name.trim().length === 0) {
      throw new BadRequestException({
        message: 'Tên người nhận tiền không được để trống',
        field: 'contact_name',
      });
    }

    // Validate description
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException({
        message: 'Lý do chi tiền không được để trống',
        field: 'description',
      });
    }

    // Validate reference consistency
    if (dto.reference_id && !dto.reference_type) {
      throw new BadRequestException({
        message: 'Phải cung cấp reference_type khi có reference_id',
        field: 'reference_type',
      });
    }

    // Validate contact consistency
    if (dto.contact_id && !dto.contact_type) {
      throw new BadRequestException({
        message: 'Phải cung cấp contact_type khi có contact_id',
        field: 'contact_type',
      });
    }
  }

  /**
   * Verify store exists
   */
  private async verifyStoreExists(storeId: string): Promise<void> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException({
        message: 'Không tìm thấy cửa hàng',
        field: 'store_id',
        value: storeId,
      });
    }
  }
}
