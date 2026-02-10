import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashTransaction,
  contact_type,
  payment_method,
  Prisma,
  transaction_source,
  transaction_type,
  TransactionReferenceType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  CASH_BOOK_EXCEL_TEMPLATE,
  TRANSACTIONS_EXCEL_TEMPLATE,
} from 'app/shared/excel-template/template/finance-excel-template';
// DTOs
import { CashBookQueryDto } from './dto/cash-book-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

// UseCases
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { CalculateCashBookUseCase } from './use-case/calculate-cash-book.usecase';
import { CancelTransactionUseCase } from './use-case/cancel-transaction.usecase';
import { CreatePaymentUseCase } from './use-case/create-payment.usecase';
import { CreateReceiptUseCase } from './use-case/create-receipt.usecase';
import { GenerateTransactionCodeUseCase } from './use-case/generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './use-case/sync-cash-book.usecase';
import { UpdateTransactionUseCase } from './use-case/update-transaction.usecase';

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
    private readonly excelTemplateService: ExcelTemplateService,
    private readonly format: Format,
    private readonly status: FormatStatus,
  ) {}

  // ========================================
  // RECEIPT OPERATIONS (Phiếu Thu)
  // ========================================
  /**
   * Create a new receipt
   * @param dto - CreateReceiptDto
   * @param storeId - ID cửa hàng (từ current store trong token)
   * @param createdBy - ID người tạo (từ user đang login)
   * @param referenceId - Optional: ID đơn hàng/phiếu liên quan
   * @param referenceType - Optional: Loại tham chiếu
   */
  async createReceipt(
    dto: CreateReceiptDto,
    storeId: string,
    createdBy: string,
    referenceId?: string,
    referenceType?: TransactionReferenceType,
    referenceCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    return this.createReceiptUseCase.execute(
      dto,
      storeId,
      createdBy,
      referenceId,
      referenceType,
      referenceCode,
      tx,
    );
  }
  // ========================================
  // PAYMENT OPERATIONS (Phiếu Chi)
  // ========================================

  /**
   * Create a new payment
   * @param dto - CreatePaymentDto
   * @param storeId - ID cửa hàng (từ current store trong token)
   * @param createdBy - ID người tạo (từ user đang login)
   * @param referenceId - Optional: ID đơn hàng/phiếu liên quan
   * @param referenceType - Optional: Loại tham chiếu
   */
  async createPayment(
    dto: CreatePaymentDto,
    storeId: string,
    createdBy: string,
    referenceId?: string,
    referenceType?: TransactionReferenceType,
    referenceCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    return this.createPaymentUseCase.execute(
      dto,
      storeId,
      createdBy,
      referenceId,
      referenceType,
      referenceCode,
      tx,
    );
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
   * Lấy danh sách giao dịch với filter và pagination (Refactored for FilterParse)
   * @param storeId - ID cửa hàng
   * @param prismaQuery - Prisma query args from FilterParse
   */
  async getTransactions(
    storeId: string,
    prismaQuery: Prisma.CashTransactionFindManyArgs,
  ) {
    const where = {
      ...prismaQuery.where,
      store_id: storeId,
    };

    const [transactions, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        ...prismaQuery,
        where,
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
    console.log(transactions);

    return {
      data: transactions,
      total,
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    return this.updateTransactionUseCase.execute(id, dto, tx);
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    return this.cancelTransactionUseCase.execute(id, cancelledBy, tx);
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
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

    const updatedTransaction = await prisma.cashTransaction.update({
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
      .syncForDate(transaction.store_id, transaction.transaction_date, tx)
      .catch((error) => {
        console.error('Failed to sync cash book:', error);
      });

    return updatedTransaction;
  }

  // ========================================
  // CASH BOOK OPERATIONS (Sổ Quỹ)
  // ========================================

  /**
   * Lấy báo cáo sổ quỹ tiền mặt
   * @param storeId - ID cửa hàng
   * @param query - CashBookQueryDto
   * @returns Cash book report
   */
  async getCashBook(storeId: string, query: CashBookQueryDto) {
    const { from_date, to_date } = query;

    const where: Prisma.CashBookEntryWhereInput = { store_id: storeId };

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
  async getCurrentBalance(
    storeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Decimal> {
    return this.calculateCashBookUseCase.getCurrentBalance(storeId, tx);
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
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.syncCashBookUseCase.syncForDateRange(
      storeId,
      fromDate,
      toDate,
      tx,
    );
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
    tx: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    // Get order details
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn hàng',
        field: 'orderId',
        value: orderId,
      });
    }

    // Validate customer exists

    const dto: CreateReceiptDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: transaction_source.SALE,
      contact_type: contact_type.CUSTOMER,
      contact_id: order.customer_id || undefined,
      contact_name: order.customer_name || order.customer?.name || undefined,
      description: `Thu tiền bán hàng đơn ${order.code || order.id}`,
    };

    // Call useCase với reference_* được set internal

    return this.createReceiptUseCase.executeFromOrder(
      dto,
      order.store_id,
      createdBy,
      orderId,
      tx,
    );
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    // Get purchase order details
    const purchase = await prisma.purchaseOrder.findUnique({
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
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: transaction_source.PURCHASE,
      contact_type: contact_type.SUPPLIER,
      contact_id: purchase.supplier_id || undefined,
      contact_name:
        purchase.supplier_name || purchase.supplier?.name || undefined,
      description: `Chi tiền nhập hàng phiếu ${purchase.order_number}`,
    };

    // ✅ ĐÚNG: Truyền đầy đủ 6 tham số
    return this.createPayment(
      dto, // 1. DTO
      purchase.store_id, // 2. storeId từ purchase
      createdBy, // 3. createdBy từ tham số
      purchaseOrderId, // 4. referenceId
      TransactionReferenceType.PURCHASE_ORDER, // 5. referenceType
      purchase.order_number, // 6. referenceCode
      tx, // 7. tx
    );
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: orderReturnId },
      include: {
        order: {
          include: { customer: true },
        },
      },
    });

    if (!orderReturn) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn trả hàng',
        field: 'orderReturnId',
        value: orderReturnId,
      });
    }

    // ✅ ĐÚNG: Dùng orderReturn, không phải purchase
    const dto: CreatePaymentDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: transaction_source.ORDER_RETURN,
      contact_type: orderReturn.order.customer_id
        ? contact_type.CUSTOMER
        : contact_type.OTHER,
      contact_id: orderReturn.order.customer_id || undefined,
      contact_name:
        orderReturn.customer_name ||
        orderReturn.order.customer_name ||
        orderReturn.order.customer?.name ||
        undefined,
      description: `Chi tiền trả hàng cho đơn ${orderReturn.order.code || orderReturn.order.id}`,
    };

    // ✅ ĐÚNG: Truyền đầy đủ 6 tham số
    return this.createPayment(
      dto, // 1. DTO
      orderReturn.store_id, // 2. storeId từ orderReturn (không phải purchase!)
      createdBy, // 3. createdBy từ tham số
      orderReturnId, // 4. referenceId (không phải purchaseOrderId!)
      TransactionReferenceType.ORDER_RETURN, // 5. referenceType
      orderReturn.order_return_number || orderReturn.order.id, // 6. referenceCode
      tx, // 7. tx
    );
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
    tx?: Prisma.TransactionClient,
  ): Promise<CashTransaction> {
    const prisma = tx || this.prisma;
    const purchaseReturn = await prisma.purchaseReturn.findUnique({
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

    // Validate supplier exists
    if (!purchaseReturn.purchase_order.supplier_id) {
      throw new BadRequestException(
        'Không thể tạo phiếu thu: Phiếu trả hàng không có thông tin nhà cung cấp',
      );
    }

    const dto: CreateReceiptDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: transaction_source.PURCHASE_RETURN,
      contact_type: contact_type.SUPPLIER,
      contact_id: purchaseReturn.purchase_order.supplier_id || undefined,
      contact_name:
        purchaseReturn.supplier_name ||
        purchaseReturn.purchase_order.supplier_name ||
        purchaseReturn.purchase_order.supplier?.name ||
        undefined,
      description: `Thu tiền trả hàng nhập phiếu ${purchaseReturn.purchase_order.order_number}`,
    };

    // Call useCase với reference_* được set internal
    return this.createReceiptUseCase.executeFromPurchaseReturn(
      dto,
      purchaseReturn.store_id,
      createdBy,
      purchaseReturnId,
      tx,
    );
  }
  // ========================================
  // STATISTICS METHODS
  // ========================================

  /**
   * Thống kê thu chi theo ngày
   * @param query - CashBookQueryDto
   * @returns Daily statistics
   */
  async getDailyStatistics(storeId: string, query: CashBookQueryDto) {
    const { from_date, to_date } = query;

    const where: Prisma.CashBookEntryWhereInput = { store_id: storeId };

    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date.gte = new Date(from_date);
      if (to_date) where.date.lte = new Date(to_date);
    }

    const entries = await this.prisma.cashBookEntry.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return entries.map((entry) => ({
      date: entry.date,
      opening_balance: entry.opening_balance.toString(),
      total_receipts: entry.total_receipts.toString(),
      total_payments: entry.total_payments.toString(),
      closing_balance: entry.closing_balance.toString(),
      net_change: entry.total_receipts.minus(entry.total_payments).toString(),
    }));
  }

  /**
   * Thống kê thu chi theo tháng
   * @param storeId - ID cửa hàng
   * @param year - Năm
   * @returns Monthly statistics
   */
  async getMonthlyStatistics(storeId: string, year: number) {
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31); // Dec 31

    const entries = await this.prisma.cashBookEntry.findMany({
      where: {
        store_id: storeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyData: any[] = [];
    for (let month = 0; month < 12; month++) {
      const monthEntries = entries.filter((e) => e.date.getMonth() === month);

      const totalReceipts = monthEntries.reduce(
        (sum, e) => sum.plus(e.total_receipts),
        new Decimal(0),
      );

      const totalPayments = monthEntries.reduce(
        (sum, e) => sum.plus(e.total_payments),
        new Decimal(0),
      );

      const openingBalance =
        monthEntries.length > 0
          ? monthEntries[0].opening_balance
          : new Decimal(0);

      const closingBalance =
        monthEntries.length > 0
          ? monthEntries[monthEntries.length - 1].closing_balance
          : new Decimal(0);

      monthlyData.push({
        month: month + 1,
        year: year,
        opening_balance: openingBalance.toString(),
        total_receipts: totalReceipts.toString(),
        total_payments: totalPayments.toString(),
        closing_balance: closingBalance.toString(),
        net_change: totalReceipts.minus(totalPayments).toString(),
      });
    }

    return monthlyData;
  }

  /**
   * Dashboard tổng quan
   * @param storeId - ID cửa hàng
   * @returns Dashboard data
   */
  async getDashboard(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Current balance
    const currentBalance = await this.getCurrentBalance(storeId);

    // Today's stats

    const todayReceipts = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'RECEIPT',
        status: 'CONFIRMED',
        transaction_date: { gte: today },
      },
      _sum: { amount: true },
      _count: true,
    });

    const todayPayments = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'PAYMENT',
        status: 'CONFIRMED',
        transaction_date: { gte: today },
      },
      _sum: { amount: true },
      _count: true,
    });

    // This week's stats
    const weekReceipts = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'RECEIPT',
        status: 'CONFIRMED',
        transaction_date: { gte: startOfWeek },
      },
      _sum: { amount: true },
      _count: true,
    });

    const weekPayments = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'PAYMENT',
        status: 'CONFIRMED',
        transaction_date: { gte: startOfWeek },
      },
      _sum: { amount: true },
      _count: true,
    });

    // This month's stats
    const monthReceipts = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'RECEIPT',
        status: 'CONFIRMED',
        transaction_date: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    const monthPayments = await this.prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: 'PAYMENT',
        status: 'CONFIRMED',
        transaction_date: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      current_balance: currentBalance.toString(),
      today: {
        receipts: {
          total: todayReceipts._sum.amount?.toString() || '0',
          count: todayReceipts._count,
        },
        payments: {
          total: todayPayments._sum.amount?.toString() || '0',
          count: todayPayments._count,
        },
        net: new Decimal(todayReceipts._sum.amount || 0)
          .minus(todayPayments._sum.amount || 0)
          .toString(),
      },
      this_week: {
        receipts: {
          total: weekReceipts._sum.amount?.toString() || '0',
          count: weekReceipts._count,
        },
        payments: {
          total: weekPayments._sum.amount?.toString() || '0',
          count: weekPayments._count,
        },
        net: new Decimal(weekReceipts._sum.amount || 0)
          .minus(weekPayments._sum.amount || 0)
          .toString(),
      },
      this_month: {
        receipts: {
          total: monthReceipts._sum.amount?.toString() || '0',
          count: monthReceipts._count,
        },
        payments: {
          total: monthPayments._sum.amount?.toString() || '0',
          count: monthPayments._count,
        },
        net: new Decimal(monthReceipts._sum.amount || 0)
          .minus(monthPayments._sum.amount || 0)
          .toString(),
      },
    };
  }

  // ========================================
  // EXPORT METHODS
  // ========================================

  /**
   * Export transactions to Excel
   * @param query - QueryTransactionDto
   * @returns Excel file data
   */
  /**
   * Export transactions to Excel
   * @param query - QueryTransactionDto
   * @returns Excel buffer
   */
  async exportTransactions(storeId: string): Promise<Buffer> {
    // Get all transactions (no pagination for export)
    const data = await this.prisma.cashTransaction.findMany({
      where: {
        store_id: storeId,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });

    // Map data to Excel format
    const excelData = data.map((transaction, index) => ({
      stt: index + 1,
      code: transaction.code,
      type: this.getTypeLabel(transaction.transaction_type),
      source: this.getSourceLabel(transaction.transaction_source),
      amount: this.format.formatCurrency(transaction.amount),
      payment_method: this.getPaymentMethodLabel(transaction.payment_method),
      contact_name: transaction.contact_name,
      description: transaction.description,
      notes: transaction.notes || '',
      status: this.status.transactionStatus(transaction.status),
      transaction_date: this.format.formatDate(transaction.transaction_date),
    }));

    // Generate Excel using template
    return this.excelTemplateService.exportData(
      TRANSACTIONS_EXCEL_TEMPLATE,
      excelData,
    );
  }

  /**
   * Export cash book to Excel
   * @param query - CashBookQueryDto
   * @returns Excel buffer
   */
  async exportCashBook(
    storeId: string,
    query: CashBookQueryDto,
  ): Promise<Buffer> {
    const cashBook = await this.getCashBook(storeId, query);

    // Map data to Excel format
    const excelData = cashBook.entries.map((entry, index) => ({
      stt: index + 1,
      date: this.format.formatDate(entry.date),
      opening_balance: this.format.formatCurrency(entry.opening_balance),
      total_receipts: this.format.formatCurrency(entry.total_receipts),
      total_payments: this.format.formatCurrency(entry.total_payments),
      closing_balance: this.format.formatCurrency(entry.closing_balance),
      net_change: this.format.formatCurrency(
        new Decimal(entry.total_receipts).minus(entry.total_payments),
      ),
    }));

    // Add summary row
    excelData.push({
      stt: cashBook.entries.length + 1,
      date: this.format.formatDate(
        cashBook.entries[cashBook.entries.length - 1].date,
      ),
      opening_balance: this.format.formatCurrency(
        cashBook.summary.opening_balance,
      ),
      total_receipts: this.format.formatCurrency(
        cashBook.summary.total_receipts,
      ),
      total_payments: this.format.formatCurrency(
        cashBook.summary.total_payments,
      ),
      closing_balance: this.format.formatCurrency(
        cashBook.summary.closing_balance,
      ),
      net_change: this.format.formatCurrency(
        new Decimal(cashBook.summary.total_receipts).minus(
          cashBook.summary.total_payments,
        ),
      ),
    });

    // Generate Excel using template
    return this.excelTemplateService.exportData(
      CASH_BOOK_EXCEL_TEMPLATE,
      excelData,
    );
  }
  // ========================================
  // HELPER METHODS (Format Labels)
  // ========================================

  /**
   * Format transaction type label
   */
  private getTypeLabel(type: transaction_type): string {
    const labels = {
      RECEIPT: 'Phiếu thu',
      PAYMENT: 'Phiếu chi',
    };
    return labels[type] || type;
  }

  /**
   * Format transaction source label
   */
  private getSourceLabel(source: transaction_source): string {
    const labels = {
      SALE: 'Bán hàng',
      PURCHASE: 'Nhập hàng',
      ORDER_RETURN: 'Trả hàng (khách trả)',
      PURCHASE_RETURN: 'Trả hàng nhập (trả NCC)',
      CUSTOMER_DEBT: 'Thu công nợ khách hàng',
      SUPPLIER_DEBT: 'Trả công nợ NCC',
      OTHER_INCOME: 'Thu khác',
      OTHER_EXPENSE: 'Chi khác',
      OPENING_BALANCE: 'Số dư đầu kỳ',
    };
    return labels[source] || source;
  }

  /**
   * Format payment method label
   */
  private getPaymentMethodLabel(method: payment_method): string {
    const labels = {
      CASH: 'Tiền mặt',
      CREDIT_CARD: 'Thẻ tín dụng',
      DEBIT_CARD: 'Thẻ ghi nợ',
      BANK_TRANSFER: 'Chuyển khoản',
      DIGITAL_WALLET: 'Ví điện tử',
    };
    return labels[method] || method;
  }
}
