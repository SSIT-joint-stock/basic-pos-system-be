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
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { GenerateTransactionCodeUseCase } from './generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './sync-cash-book.usecase';

/**
 * UseCase: Tạo phiếu chi mới
 * Flow:
 * 1. Validate input
 * 2. Verify store exists
 * 3. Validate reference (nếu có)
 * 4. Query contact_name from database
 * 5. Generate payment code (PC00001...)
 * 6. Create transaction
 * 7. Sync cash book
 */
@Injectable()
export class CreatePaymentUseCase {
  private readonly logger = new Logger(CreatePaymentUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCodeUseCase: GenerateTransactionCodeUseCase,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}

  /**
   * Execute: Tạo phiếu chi
   * @param dto - CreatePaymentDto
   * @param storeId - ID cửa hàng (từ current store trong token)
   * @param createdBy - ID người tạo (từ user đang login)
   * @param referenceId - Optional: ID đơn hàng/phiếu liên quan (từ query params)
   * @param referenceType - Optional: Loại tham chiếu (từ query params)
   * @returns CashTransaction đã tạo
   */
  async execute(
    dto: CreatePaymentDto,
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

    // 4. Query contact_name from database
    let contactName: string | undefined;
    if (dto.contact_id) {
      contactName = await this.getContactName(
        dto.contact_id,
        dto.contact_type,
        tx,
      );
    }

    // 5. Generate payment code
    const code = await this.generateCodeUseCase.generatePaymentCode(storeId);

    // 6. Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.PAYMENT,
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Contact info
        contact_type: dto.contact_type,
        contact_id: dto.contact_id || null,
        contact_name: contactName,

        // Reference info (từ query params hoặc null)
        // Reference info
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
   * Execute from PurchaseOrder: Tạo phiếu chi từ đơn nhập hàng
   */
  async executeFromPurchase(
    dto: CreatePaymentDto,
    storeId: string,
    createdBy: string,
    purchaseOrderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    this.validateInput(dto);
    await this.verifyStoreExists(storeId, tx);

    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { supplier: true },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase Order not found');
    }

    const code = await this.generateCodeUseCase.generatePaymentCode(storeId);

    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.PAYMENT,

        // Snapshot contact from Purchase Order
        contact_id: purchase.supplier_id,
        contact_name: purchase.supplier?.name,
        contact_type: dto.contact_type,

        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Reference info
        reference_type: TransactionReferenceType.PURCHASE_ORDER,
        reference_id: purchaseOrderId,
        reference_code: purchase.order_number,

        description: dto.description || '',
        notes: dto.notes || null,
        status: transaction_status.CONFIRMED,
        transaction_date: new Date(),
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
   * Execute from OrderReturn: Tạo phiếu chi từ trả hàng cho khách
   */
  async executeFromOrderReturn(
    dto: CreatePaymentDto,
    storeId: string,
    createdBy: string,
    orderReturnId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    this.validateInput(dto);
    await this.verifyStoreExists(storeId, tx);

    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: orderReturnId },
      include: {
        order: {
          include: { customer: true },
        },
      },
    });

    if (!orderReturn) {
      throw new NotFoundException('Order Return not found');
    }

    const code = await this.generateCodeUseCase.generatePaymentCode(storeId);

    const transaction = await prisma.cashTransaction.create({
      data: {
        code,
        store_id: storeId,
        transaction_type: transaction_type.PAYMENT,
        transaction_source: dto.transaction_source,
        amount: new Decimal(dto.amount),
        payment_method: dto.payment_method,

        // Snapshot contact from Order Return -> Order -> Customer
        contact_type: dto.contact_type,
        contact_id: orderReturn.order.customer_id,
        contact_name: orderReturn.order.customer?.name,

        // Reference info
        reference_type: TransactionReferenceType.ORDER_RETURN,
        reference_id: orderReturnId,
        reference_code: orderReturn.id, // Assuming ID as code if no dedicated code field

        description: dto.description || '',
        notes: dto.notes || null,
        status: transaction_status.CONFIRMED,
        transaction_date: new Date(),
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
    if (!referenceType && !referenceId) {
      return;
    }

    if ((referenceType && !referenceId) || (!referenceType && referenceId)) {
      throw new BadRequestException(
        'Phải cung cấp cả reference_type và reference_id',
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(referenceId!)) {
      throw new BadRequestException('Reference ID phải là UUID hợp lệ');
    }

    if (referenceType === TransactionReferenceType.PURCHASE_ORDER) {
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
    } else {
      throw new BadRequestException(
        'Reference type không hợp lệ. Chỉ chấp nhận: PurchaseOrder, OrderReturn',
      );
    }
  }

  /**
   * Validate input
   */
  private validateInput(dto: CreatePaymentDto): void {
    if (dto.amount <= 0) {
      throw new BadRequestException({
        message: 'Số tiền chi phải lớn hơn 0',
        field: 'amount',
        value: dto.amount,
      });
    }

    const MAX_AMOUNT = 999999999999.99;
    if (dto.amount > MAX_AMOUNT) {
      throw new BadRequestException({
        message: `Số tiền chi không được vượt quá ${MAX_AMOUNT.toLocaleString('vi-VN')} VNĐ`,
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
      // Logic for Store Member (User)
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
      return contact_type.OTHER;
    }
  }
}
