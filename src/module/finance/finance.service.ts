import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CashTransaction, payment_method } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// DTOs
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { CashBookQueryDto } from './dto/cash-book-query.dto';

// UseCases
import { GenerateTransactionCodeUseCase } from './use-case/generate-transaction-code.usecase';
import { CreateReceiptUseCase } from './use-case/create-receipt.usecase';
import { CreatePaymentUseCase } from './use-case/create-payment.usecase';
import { UpdateTransactionUseCase } from './use-case/update-transaction.usecase';
import { CancelTransactionUseCase } from './use-case/cancel-transaction.usecase';
import { CalculateCashBookUseCase } from './use-case/calculate-cash-book.usecase';
import { SyncCashBookUseCase } from './use-case/sync-cash-book.usecase';

/**
 * Finance Service - Orchestration Layer
 * Điều phối các UseCases và cung cấp APIs cho Controller
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCodeUseCase: GenerateTransactionCodeUseCase,
    private readonly createReceiptUseCase: CreateReceiptUseCase,
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly cancelTransactionUseCase: CancelTransactionUseCase,
    private readonly calculateCashBookUseCase: CalculateCashBookUseCase,
    private readonly syncCashBookUseCase: SyncCashBookUseCase,
  ) {}

  // ========================================
  // RECEIPT OPERATIONS (Phiếu Thu)
  // ========================================

  /**
   * Tạo phiếu thu mới
   * @param dto - CreateReceiptDto
   * @returns CashTransaction
   */
  async createReceipt(dto: CreateReceiptDto): Promise<CashTransaction> {
    return this.createReceiptUseCase.execute(dto);
  }

  // ========================================
  // PAYMENT OPERATIONS (Phiếu Chi)
  // ========================================

  /**
   * Tạo phiếu chi mới
   * @param dto - CreatePaymentDto
   * @returns CashTransaction
   */
  async createPayment(dto: CreatePaymentDto): Promise<CashTransaction> {
    return this.createPaymentUseCase.execute(dto);
  }

  // ========================================
  // TRANSACTION OPERATIONS (CRUD)
  // ========================================

  /**
   * Lấy chi tiết một giao dịch
   * @param id - ID giao dịch
   * @returns CashTransaction
   */
  async getTransaction(id: string): Promise<CashTransaction> {
    const transaction = await this.prisma.cashTransaction.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException({
        message: 'Không tìm thấy giao dịch',
        field: 'id',
        value: id,
      });
    }

    return transaction;
  }

  /**
   * Lấy danh sách giao dịch với filter và pagination
   * @param query - QueryTransactionDto
   * @returns Paginated transactions
   */
  async getTransactions(query: QueryTransactionDto) {
    const {
      store_id,
      transaction_type,
      transaction_source,
      status,
      payment_method,
      from_date,
      to_date,
      search,
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const where: any = {};

    if (store_id) where.store_id = store_id;
    if (transaction_type) where.transaction_type = transaction_type;
    if (transaction_source) where.transaction_source = transaction_source;
    if (status) where.status = status;
    if (payment_method) where.payment_method = payment_method;

    // Date range filter
    if (from_date || to_date) {
      where.transaction_date = {};
      if (from_date) {
        where.transaction_date.gte = new Date(from_date);
      }
      if (to_date) {
        const endDate = new Date(to_date);
        endDate.setHours(23, 59, 59, 999);
        where.transaction_date.lte = endDate;
      }
    }

    // Search filter (code, contact_name, description)
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { contact_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Execute queries
    const [transactions, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where,
        skip,
        take,
        orderBy: {
          transaction_date: 'desc',
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cập nhật giao dịch
   * @param id - ID giao dịch
   * @param dto - UpdateTransactionDto
   * @returns CashTransaction đã update
   */
  async updateTransaction(
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<CashTransaction> {
    return this.updateTransactionUseCase.execute(id, dto);
  }

  /**
   * Hủy giao dịch
   * @param id - ID giao dịch
   * @param cancelledBy - ID người hủy
   * @returns CashTransaction đã hủy
   */
  async cancelTransaction(
    id: string,
    cancelledBy: string,
  ): Promise<CashTransaction> {
    return this.cancelTransactionUseCase.execute(id, cancelledBy);
  }

  /**
   * Approve (duyệt) giao dịch
   * @param id - ID giao dịch
   * @param approvedBy - ID người duyệt
   * @returns CashTransaction đã duyệt
   */
  async approveTransaction(
    id: string,
    approvedBy: string,
  ): Promise<CashTransaction> {
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

    const updatedTransaction = await this.prisma.cashTransaction.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        approved_by: approvedBy,
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

    // Re-sync cash book
    this.syncCashBookUseCase
      .syncForDate(transaction.store_id, transaction.transaction_date)
      .catch((error) => {
        console.error('Failed to sync cash book:', error);
      });

    return updatedTransaction;
  }

  // ========================================
  // CASH BOOK OPERATIONS (Sổ Quỹ)
  // ========================================

  /**
   * Lấy báo cáo sổ quỹ
   * @param query - CashBookQueryDto
   * @returns Cash book entries
   */
  async getCashBook(query: CashBookQueryDto) {
    const { store_id, from_date, to_date } = query;

    const where: any = { store_id };

    // Date range
    if (from_date || to_date) {
      where.date = {};
      if (from_date) {
        where.date.gte = new Date(from_date);
      }
      if (to_date) {
        where.date.lte = new Date(to_date);
      }
    }

    const entries = await this.prisma.cashBookEntry.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const totalReceipts = entries.reduce(
      (sum, entry) => sum.plus(entry.total_receipts),
      new Decimal(0),
    );

    const totalPayments = entries.reduce(
      (sum, entry) => sum.plus(entry.total_payments),
      new Decimal(0),
    );

    const openingBalance =
      entries.length > 0 ? entries[0].opening_balance : new Decimal(0);

    const closingBalance =
      entries.length > 0
        ? entries[entries.length - 1].closing_balance
        : new Decimal(0);

    return {
      entries,
      summary: {
        opening_balance: openingBalance,
        total_receipts: totalReceipts,
        total_payments: totalPayments,
        closing_balance: closingBalance,
      },
    };
  }

  /**
   * Lấy số dư hiện tại của cửa hàng
   * @param storeId - ID cửa hàng
   * @returns Current balance
   */
  async getCurrentBalance(storeId: string): Promise<Decimal> {
    return this.calculateCashBookUseCase.getCurrentBalance(storeId);
  }

  /**
   * Sync lại sổ quỹ cho một khoảng thời gian
   * @param storeId - ID cửa hàng
   * @param fromDate - Từ ngày
   * @param toDate - Đến ngày
   */
  async syncCashBookRange(
    storeId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    await this.syncCashBookUseCase.syncForDateRange(storeId, fromDate, toDate);
  }

  // ========================================
  // INTEGRATION HELPER METHODS
  // (Dùng cho Orders, Purchase Orders, Returns modules)
  // ========================================

  /**
   * Tạo phiếu thu từ đơn bán hàng
   * @param orderId - ID đơn hàng
   * @returns CashTransaction
   */
  /**
   * Tạo phiếu thu từ đơn bán hàng
   * @param orderId - ID đơn hàng
   * @returns CashTransaction
   */
  // ========================================
  // INTEGRATION HELPER METHODS
  // (Dùng cho Orders, Purchase Orders, Returns modules)
  // ========================================

  /**
   * Tạo phiếu thu từ đơn bán hàng
   * @param orderId - ID đơn hàng
   * @param createdBy - ID người tạo
   * @param amount - Số tiền thu
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */
  async createReceiptFromOrder(
    orderId: string,
    createdBy: string,
    amount: number,
    paymentMethod: payment_method,
  ): Promise<CashTransaction> {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn hàng',
        field: 'orderId',
        value: orderId,
      });
    }

    // Map to CreateReceiptDto
    const dto: CreateReceiptDto = {
      store_id: order.store_id,
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'SALE',
      contact_name: order.customer_name || 'Khách lẻ',
      contact_id: order.customer_id || undefined,
      contact_type: order.customer_id ? 'Customer' : undefined,
      description: `Thu tiền bán hàng đơn ${order.code || order.id}`,
      reference_type: 'Order',
      reference_id: orderId,
      created_by: createdBy,
    };

    return this.createReceipt(dto);
  }

  /**
   * Tạo phiếu chi từ đơn nhập hàng
   * @param purchaseOrderId - ID đơn nhập
   * @param createdBy - ID người tạo
   * @param amount - Số tiền chi
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */
  async createPaymentFromPurchase(
    purchaseOrderId: string,
    createdBy: string,
    amount: number,
    paymentMethod: payment_method,
  ): Promise<CashTransaction> {
    // Get purchase order details
    const purchase = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn nhập hàng',
        field: 'purchaseOrderId',
        value: purchaseOrderId,
      });
    }

    // Map to CreatePaymentDto
    const dto: CreatePaymentDto = {
      store_id: purchase.store_id,
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'PURCHASE',
      contact_name: purchase.supplier?.name || purchase.supplier_name,
      contact_id: purchase.supplier_id,
      contact_type: 'Supplier',
      description: `Chi tiền nhập hàng phiếu ${purchase.order_number}`,
      reference_type: 'PurchaseOrder',
      reference_id: purchaseOrderId,
      created_by: createdBy,
    };

    return this.createPayment(dto);
  }

  /**
   * Tạo phiếu chi từ trả hàng (khách trả)
   * @param orderReturnId - ID đơn trả hàng
   * @param createdBy - ID người tạo
   * @param amount - Số tiền chi
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */
  async createPaymentFromOrderReturn(
    orderReturnId: string,
    createdBy: string,
    amount: number,
    paymentMethod: payment_method,
  ): Promise<CashTransaction> {
    const orderReturn = await this.prisma.orderReturn.findUnique({
      where: { id: orderReturnId },
      include: {
        order: true,
      },
    });

    if (!orderReturn) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn trả hàng',
        field: 'orderReturnId',
        value: orderReturnId,
      });
    }

    const dto: CreatePaymentDto = {
      store_id: orderReturn.store_id,
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'ORDER_RETURN',
      contact_name: orderReturn.order.customer_name || 'Khách lẻ',
      contact_id: orderReturn.order.customer_id || undefined,
      contact_type: orderReturn.order.customer_id ? 'Customer' : undefined,
      description: `Chi tiền trả hàng cho đơn ${orderReturn.order.code || orderReturn.order.id}`,
      reference_type: 'OrderReturn',
      reference_id: orderReturnId,
      created_by: createdBy,
    };

    return this.createPayment(dto);
  }

  /**
   * Tạo phiếu thu từ trả hàng nhập (trả NCC)
   * @param purchaseReturnId - ID đơn trả hàng nhập
   * @param createdBy - ID người tạo
   * @param amount - Số tiền thu
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */
  /**
   * Tạo phiếu thu từ trả hàng nhập (trả NCC)
   * @param purchaseReturnId - ID đơn trả hàng nhập
   * @param createdBy - ID người tạo
   * @param amount - Số tiền thu
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */
  async createReceiptFromPurchaseReturn(
    purchaseReturnId: string,
    createdBy: string,
    amount: number,
    paymentMethod: payment_method,
  ): Promise<CashTransaction> {
    const purchaseReturn = await this.prisma.purchaseReturn.findUnique({
      where: { id: purchaseReturnId },
      include: {
        purchase_order: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!purchaseReturn) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn trả hàng nhập',
        field: 'purchaseReturnId',
        value: purchaseReturnId,
      });
    }

    // Null check for purchase_order
    if (!purchaseReturn.purchase_order) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn nhập hàng liên quan',
        field: 'purchase_order',
      });
    }

    const dto: CreateReceiptDto = {
      store_id: purchaseReturn.store_id,
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'PURCHASE_RETURN',
      contact_name:
        purchaseReturn.purchase_order.supplier?.name ||
        purchaseReturn.purchase_order.supplier_name,
      contact_id: purchaseReturn.purchase_order.supplier_id,
      contact_type: 'Supplier',
      description: `Thu tiền trả hàng nhập phiếu ${purchaseReturn.purchase_order.order_number}`,
      reference_type: 'PurchaseReturn',
      reference_id: purchaseReturnId,
      created_by: createdBy,
    };

    return this.createReceipt(dto);
  }
}
