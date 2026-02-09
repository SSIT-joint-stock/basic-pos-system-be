import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { CashTransaction, payment_method } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  TRANSACTIONS_EXCEL_TEMPLATE,
  CASH_BOOK_EXCEL_TEMPLATE,
} from 'app/shared/excel-template/template/finance-excel-template';
import {
  transaction_type,
  transaction_source,
  transaction_status,
} from '@prisma/client';
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
    private readonly excelTemplateService: ExcelTemplateService,
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
    referenceType?: string,
  ): Promise<CashTransaction> {
    return this.createReceiptUseCase.execute(
      dto,
      storeId,
      createdBy,
      referenceId,
      referenceType,
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
    referenceType?: string,
  ): Promise<CashTransaction> {
    return this.createPaymentUseCase.execute(
      dto,
      storeId,
      createdBy,
      referenceId,
      referenceType,
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

    // Validate customer exists
    if (!order.customer_id) {
      throw new BadRequestException(
        'Không thể tạo phiếu thu: Đơn hàng không có thông tin khách hàng',
      );
    }

    const dto: CreateReceiptDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'SALE',
      contact_id: order.customer_id,
      contact_type: 'Customer',
      description: `Thu tiền bán hàng đơn ${order.code || order.id}`,
    };

    // Call useCase với reference_* được set internal

    return this.createReceiptUseCase.executeFromOrder(
      dto,
      order.store_id,
      createdBy,
      orderId,
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
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'PURCHASE',
      contact_id: purchase.supplier_id,
      contact_type: 'Supplier',
      description: `Chi tiền nhập hàng phiếu ${purchase.order_number}`,
    };

    // ✅ ĐÚNG: Truyền đầy đủ 5 tham số
    return this.createPayment(
      dto, // 1. DTO
      purchase.store_id, // 2. storeId từ purchase
      createdBy, // 3. createdBy từ tham số
      purchaseOrderId, // 4. referenceId
      'PurchaseOrder', // 5. referenceType
    );
  }

  /**
   * Tạo phiếu chi từ trả hàng (khách trả)
   * @param orderReturnId - ID đơn trả hàng
   * @param createdBy - ID người tạo
   * @param amount - Số tiền chi
   * @param paymentMethod - Phương thức thanh toán
   * @returns CashTransaction
   */ async createPaymentFromOrderReturn(
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

    // ✅ ĐÚNG: Dùng orderReturn, không phải purchase
    const dto: CreatePaymentDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'ORDER_RETURN', // ✅ ĐÚNG
      contact_id: orderReturn.order.customer_id || orderReturn.order.id, // ✅ ĐÚNG
      contact_type: orderReturn.order.customer_id ? 'Customer' : 'Other', // ✅ ĐÚNG
      description: `Chi tiền trả hàng cho đơn ${orderReturn.order.code || orderReturn.order.id}`, // ✅ ĐÚNG
    };

    // ✅ ĐÚNG: Truyền đầy đủ 5 tham số
    return this.createPayment(
      dto, // 1. DTO
      orderReturn.store_id, // 2. storeId từ orderReturn (không phải purchase!)
      createdBy, // 3. createdBy từ tham số
      orderReturnId, // 4. referenceId (không phải purchaseOrderId!)
      'OrderReturn', // 5. referenceType
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

    // Validate supplier exists
    if (!purchaseReturn.purchase_order.supplier_id) {
      throw new BadRequestException(
        'Không thể tạo phiếu thu: Phiếu trả hàng không có thông tin nhà cung cấp',
      );
    }

    const dto: CreateReceiptDto = {
      amount: amount,
      payment_method: paymentMethod,
      transaction_source: 'PURCHASE_RETURN',
      contact_id: purchaseReturn.purchase_order.supplier_id,
      contact_type: 'Supplier',
      description: `Thu tiền trả hàng nhập phiếu ${purchaseReturn.purchase_order.order_number}`,
    };

    // Call useCase với reference_* được set internal
    return this.createReceiptUseCase.executeFromPurchaseReturn(
      dto,
      purchaseReturn.store_id,
      createdBy,
      purchaseReturnId,
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
  async getDailyStatistics(query: CashBookQueryDto) {
    const { store_id, from_date, to_date } = query;

    const where: any = { store_id };

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
  async exportTransactions(query: QueryTransactionDto): Promise<Buffer> {
    // Get all transactions (no pagination for export)
    const { data } = await this.getTransactions({
      ...query,
      limit: 10000, // Max for export
    });

    // Map data to Excel format
    const excelData = data.map((transaction, index) => ({
      stt: index + 1,
      code: transaction.code,
      type: this.getTypeLabel(transaction.transaction_type),
      source: this.getSourceLabel(transaction.transaction_source),
      amount: this.formatCurrency(transaction.amount),
      payment_method: this.getPaymentMethodLabel(transaction.payment_method),
      contact_name: transaction.contact_name,
      description: transaction.description,
      notes: transaction.notes || '',
      status: this.getStatusLabel(transaction.status),
      transaction_date: this.formatDate(transaction.transaction_date),
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
  async exportCashBook(query: CashBookQueryDto): Promise<Buffer> {
    const cashBook = await this.getCashBook(query);

    // Map data to Excel format
    const excelData = cashBook.entries.map((entry, index) => ({
      stt: index + 1,
      date: this.formatDateOnly(entry.date),
      opening_balance: this.formatCurrency(entry.opening_balance),
      total_receipts: this.formatCurrency(entry.total_receipts),
      total_payments: this.formatCurrency(entry.total_payments),
      closing_balance: this.formatCurrency(entry.closing_balance),
      net_change: this.formatCurrency(
        new Decimal(entry.total_receipts).minus(entry.total_payments),
      ),
    }));

    // Add summary row
    excelData.push({
      stt: '',
      date: '📊 TỔNG CỘNG',
      opening_balance: this.formatCurrency(cashBook.summary.opening_balance),
      total_receipts: this.formatCurrency(cashBook.summary.total_receipts),
      total_payments: this.formatCurrency(cashBook.summary.total_payments),
      closing_balance: this.formatCurrency(cashBook.summary.closing_balance),
      net_change: this.formatCurrency(
        new Decimal(cashBook.summary.total_receipts).minus(
          cashBook.summary.total_payments,
        ),
      ),
    } as any);

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

  /**
   * Format transaction status label
   */
  private getStatusLabel(status: transaction_status): string {
    const labels = {
      PENDING: 'Chờ duyệt',
      CONFIRMED: 'Đã duyệt',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  }

  /**
   * Format date to Vietnamese format
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Format date only (no time)
   */
  private formatDateOnly(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Format number to currency
   */
  private formatCurrency(value: number | Decimal): number {
    return typeof value === 'number' ? value : Number(value);
  }
}
