import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CashTransaction,
  contact_type,
  Prisma,
  transaction_status,
  transaction_type,
  TransactionReferenceType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'app/prisma/prisma.service';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { GenerateTransactionCodeUseCase } from './generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';

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
    referenceType?: TransactionReferenceType,
    referenceCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId, tx);
    // 3. Validate reference (nếu có)
    await this.validateReference(storeId, referenceType, referenceId, tx);
    // 4. Query contact_name from database
    let contactName: string | undefined;
    if (dto.contact_id) {
      contactName = await this.getContactName(
        dto.contact_id,
        dto.contact_type,
        tx,
      );
    }

    // 5. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 6. Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.RECEIPT,
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type,
        contact_id: dto.contact_id || null,
        contact_name: contactName,

        // Reference info (từ query params hoặc null)
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        reference_code: referenceCode || null,

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: transaction_status.CONFIRMED,
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
    await this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date, tx)
      .catch((error: Error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date.toISOString()}`,
          error?.stack,
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId, tx);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 4. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 5. Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.RECEIPT,
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Snapshot contact from Order
        contact_type: dto.contact_type,
        contact_id: order.customer_id,
        contact_name: order.customer?.name,

        // Reference info (SET từ Order)
        reference_type: TransactionReferenceType.ORDER,
        reference_id: orderId,
        reference_code: order.code,

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: transaction_status.CONFIRMED,
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
    await this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date, tx)
      .catch((error: Error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date.toISOString()}`,
          error?.stack,
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    // 1. Validate input
    this.validateInput(dto);

    // 2. Verify store exists
    await this.verifyStoreExists(storeId, tx);

    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id: purchaseReturnId },
      include: {
        purchase_order: {
          include: { supplier: true },
        },
      },
    });

    if (!purchaseReturn) {
      throw new NotFoundException('Purchase Return not found');
    }

    // 4. Generate receipt code
    const code = await this.generateCodeUseCase.generateReceiptCode(storeId);

    // 5. Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.RECEIPT, // Correct enum access
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Snapshot contact from Purchase Return -> PO -> Supplier
        contact_type: dto.contact_type,
        contact_id: purchaseReturn.purchase_order?.supplier_id,
        contact_name: purchaseReturn.purchase_order?.supplier?.name,

        // Reference info (SET từ PurchaseReturn)
        reference_type: TransactionReferenceType.PURCHASE_RETURN,
        reference_id: purchaseReturnId,
        reference_code: purchaseReturn.return_number, // Assuming ID as code

        // Description
        description: dto.description || '',
        notes: dto.notes || null,

        // Status
        status: transaction_status.CONFIRMED,
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
    await this.syncCashBookUseCase
      .syncForDate(storeId, transaction.transaction_date, tx)
      .catch((error: Error) => {
        this.logger.error(
          `Failed to sync cash book for store ${storeId} on ${transaction.transaction_date.toISOString()}`,
          error?.stack,
          'SyncCashBookError',
        );
      });

    return transaction;
  }

  /**
   * Validate reference if provided
   */
  private async validateReference(
    storeId: string,
    referenceType?: TransactionReferenceType,
    referenceId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
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
    // Validate reference tồn tại
    if (referenceType === TransactionReferenceType.ORDER) {
      const order = await prisma.order.findUnique({
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
    } else if (referenceType === TransactionReferenceType.PURCHASE_ORDER) {
      const purchase = await prisma.purchaseOrder.findUnique({
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
    } else if (referenceType === TransactionReferenceType.ORDER_RETURN) {
      const orderReturn = await prisma.orderReturn.findUnique({
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
    } else if (referenceType === TransactionReferenceType.PURCHASE_RETURN) {
      const purchaseReturn = await prisma.purchaseReturn.findUnique({
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
  private async verifyStoreExists(
    storeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    const store = await prisma.store.findUnique({
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
  private async getContactName(
    contactId: string,
    contactType: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const prisma = tx || this.prisma;
    if (contactType === contact_type.CUSTOMER) {
      const customer = await prisma.customer.findUnique({
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
    } else if (contactType === contact_type.SUPPLIER) {
      const supplier = await prisma.supplier.findUnique({
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
    } else if (contactType === contact_type.STORE_MEMBER) {
      const user = await prisma.user.findUnique({
        where: { id: contactId },
        select: { username: true },
      });

      if (!user) {
        throw new NotFoundException({
          message: 'Không tìm thấy nhân viên',
          field: 'contact_id',
          value: contactId,
        });
      }
      return user.username;
    } else {
      // Other type
      return contact_type.OTHER;
    }
  }
}
