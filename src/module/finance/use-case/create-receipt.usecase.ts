import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { CashTransaction } from '@prisma/client';
import { GenerateTransactionCodeUseCase } from './generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * UseCase: Tạo phiếu thu mới
 * Flow:
 * 1. Validate input
 * 2. Verify store exists
 * 3. Query contact_name from database
 * 4. Generate receipt code (PT00001...)
 * 5. Create transaction
 * 6. Sync cash book
 */
@Injectable()
export class CreateReceiptUseCase {
  private readonly logger = new Logger(CreateReceiptUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCodeUseCase: GenerateTransactionCodeUseCase,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}
  /**
   * Execute: Tạo phiếu thu
   * @param dto - CreateReceiptDto
   * @param storeId - ID cửa hàng (từ current store trong token)
   * @param createdBy - ID người tạo (từ user đang login)
   * @param referenceId - Optional: ID đơn hàng/phiếu liên quan
   * @param referenceType - Optional: Loại tham chiếu
   * @returns CashTransaction đã tạo
   */
  async execute(
    dto: CreateReceiptDto,
    storeId: string,
    createdBy: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<CashTransaction> {
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId);

    // 3. Validate reference (nếu có)
    await this.validateReference(storeId, referenceType, referenceId);

    // 4. Query contact_name from database
    const contactName = await this.getContactName(
      dto.contact_id,
      dto.contact_type,
    );

    // 5. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 6. Create transaction
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: 'RECEIPT',
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type,
        contact_id: dto.contact_id,
        contact_name: contactName,

        // Reference info (từ query params hoặc null)
        reference_type: referenceType || null,
        reference_id: referenceId || null,

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: 'CONFIRMED',
        transaction_date: new Date(),

        // Audit
        created_by: createdBy,
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

    // 7. Sync cash book
    this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date)
      .catch((error: Error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date}`,
          error.stack,
          'SyncCashBookError',
        );
      });

    return transaction;
  }
  /**
   * Execute from Order: Tạo phiếu thu từ đơn hàng
   * Khác với execute() thường: Có reference_type và reference_id
   */
  async executeFromOrder(
    dto: CreateReceiptDto,
    storeId: string,
    createdBy: string,
    orderId: string,
  ): Promise<CashTransaction> {
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId);

    // 3. Query contact_name from database
    const contactName = await this.getContactName(
      dto.contact_id,
      dto.contact_type,
    );

    // 4. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 5. Create transaction
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: 'RECEIPT',
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type,
        contact_id: dto.contact_id,
        contact_name: contactName,

        // Reference info (SET từ Order)
        reference_type: 'Order',
        reference_id: orderId,

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: 'CONFIRMED',
        transaction_date: new Date(),

        // Audit
        created_by: createdBy,
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

    // 6. Sync cash book
    this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date)
      .catch((error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date}`,
          error.stack,
          'SyncCashBookError',
        );
      });

    return transaction;
  }

  /**
   * Execute from PurchaseReturn: Tạo phiếu thu từ trả hàng nhập
   */
  async executeFromPurchaseReturn(
    dto: CreateReceiptDto,
    storeId: string,
    createdBy: string,
    purchaseReturnId: string,
  ): Promise<CashTransaction> {
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId);

    // 3. Query contact_name from database
    const contactName = await this.getContactName(
      dto.contact_id,
      dto.contact_type,
    );

    // 4. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 5. Create transaction
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: 'RECEIPT',
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type,
        contact_id: dto.contact_id,
        contact_name: contactName,

        // Reference info (SET từ PurchaseReturn)
        reference_type: 'PurchaseReturn',
        reference_id: purchaseReturnId,

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: 'CONFIRMED',
        transaction_date: new Date(),

        // Audit
        created_by: createdBy,
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

    // 6. Sync cash book
    this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date)
      .catch((error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date}`,
          error.stack,
          'SyncCashBookError',
        );
      });

    return transaction;
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
      // Other type
      return 'Khác';
    }
  }
  /**
   * Validate reference if provided
   */
  private async validateReference(
    storeId: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<void> {
    // Nếu không có reference → OK
    if (!referenceType && !referenceId) {
      return;
    }

    // Nếu có 1 trong 2 → Lỗi
    if ((referenceType && !referenceId) || (!referenceType && referenceId)) {
      throw new BadRequestException(
        'Phải cung cấp cả reference_type và reference_id',
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(referenceId!)) {
      throw new BadRequestException('Reference ID phải là UUID hợp lệ');
    }

    // Validate reference tồn tại
    if (referenceType === 'Order') {
      const order = await this.prisma.order.findUnique({
        where: { id: referenceId },
        select: { id: true, store_id: true },
      });

      if (!order) {
        throw new NotFoundException({
          message: 'Không tìm thấy đơn hàng',
          field: 'reference_id',
          value: referenceId,
        });
      }

      // Validate order thuộc store hiện tại
      if (order.store_id !== storeId) {
        throw new BadRequestException('Đơn hàng không thuộc cửa hàng hiện tại');
      }
    } else if (referenceType === 'PurchaseOrder') {
      const purchase = await this.prisma.purchaseOrder.findUnique({
        where: { id: referenceId },
        select: { id: true, store_id: true },
      });

      if (!purchase) {
        throw new NotFoundException({
          message: 'Không tìm thấy đơn nhập hàng',
          field: 'reference_id',
          value: referenceId,
        });
      }

      // Validate purchase thuộc store hiện tại
      if (purchase.store_id !== storeId) {
        throw new BadRequestException(
          'Đơn nhập hàng không thuộc cửa hàng hiện tại',
        );
      }
    } else if (referenceType === 'OrderReturn') {
      const orderReturn = await this.prisma.orderReturn.findUnique({
        where: { id: referenceId },
        select: { id: true, store_id: true },
      });

      if (!orderReturn) {
        throw new NotFoundException({
          message: 'Không tìm thấy phiếu trả hàng',
          field: 'reference_id',
          value: referenceId,
        });
      }

      if (orderReturn.store_id !== storeId) {
        throw new BadRequestException(
          'Phiếu trả hàng không thuộc cửa hàng hiện tại',
        );
      }
    } else if (referenceType === 'PurchaseReturn') {
      const purchaseReturn = await this.prisma.purchaseReturn.findUnique({
        where: { id: referenceId },
        select: { id: true, store_id: true },
      });

      if (!purchaseReturn) {
        throw new NotFoundException({
          message: 'Không tìm thấy phiếu trả hàng nhập',
          field: 'reference_id',
          value: referenceId,
        });
      }

      if (purchaseReturn.store_id !== storeId) {
        throw new BadRequestException(
          'Phiếu trả hàng nhập không thuộc cửa hàng hiện tại',
        );
      }
    } else {
      throw new BadRequestException(
        'Reference type không hợp lệ. Chỉ chấp nhận: Order, PurchaseOrder, OrderReturn, PurchaseReturn',
      );
    }
  }
  /**
   * Validate input
   */
  private validateInput(dto: CreateReceiptDto): void {
    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException({
        message: 'Số tiền thu phải lớn hơn 0',
        field: 'amount',
        value: dto.amount,
      });
    }

    // Validate amount max
    const MAX_AMOUNT = 999999999999.99;
    if (dto.amount > MAX_AMOUNT) {
      throw new BadRequestException({
        message: `Số tiền thu không được vượt quá ${MAX_AMOUNT.toLocaleString('vi-VN')} VNĐ`,
        field: 'amount',
        value: dto.amount,
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
