import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  contact_type,
  payment_method,
  transaction_source,
  transaction_status,
  transaction_type,
  TransactionReferenceType,
} from '@prisma/client';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import type { IUser } from 'app/common/types/user.type';
import type { Response } from 'express';
import z from 'zod';
import { FinanceService } from './finance.service';

// DTOs
import { CashBookQueryDto } from './dto/cash-book-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/**
 * Finance Controller
 * REST API cho quản lý phiếu thu/chi và sổ quỹ
 */
@ApiTags('Finance - Quản lý tài chính')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ========================================
  // RECEIPT ENDPOINTS (Phiếu Thu)
  // ========================================

  /**
   * Tạo phiếu thu mới
   * POST /finance/receipts
   */
  @Post('receipts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo phiếu thu mới',
    description: 'Tạo phiếu thu tiền mặt vào quỹ (PT00001, PT00002...)',
  })
  @ApiQuery({
    name: 'reference_id',
    required: false,
    description: 'ID đơn hàng/phiếu liên quan (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'reference_type',
    required: false,
    description: 'Loại tham chiếu (Order, PurchaseOrder, OrderReturn...)',
    enum: TransactionReferenceType,
  })
  @ApiQuery({
    name: 'reference_code',
    required: false,
    description: 'Mã tham chiếu (VD: HD00001)',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Phiếu thu đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy cửa hàng hoặc reference',
  })
  async createReceipt(
    @Body() dto: CreateReceiptDto,
    @User() user: IUser,
    @Query('reference_id') referenceId?: string,
    @Query('reference_type') referenceType?: TransactionReferenceType,
    @Query('reference_code') referenceCode?: string,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Vui lòng chọn cửa hàng trước khi tạo phiếu thu',
      );
    }

    return this.financeService.createReceipt(
      dto,
      user.storeId,
      user.id,
      referenceId,
      referenceType,
      referenceCode,
    );
  }
  // ========================================
  // PAYMENT ENDPOINTS (Phiếu Chi)
  // ========================================

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo phiếu chi mới',
    description: 'Tạo phiếu chi tiền mặt ra khỏi quỹ (PC00001, PC00002...)',
  })
  @ApiQuery({
    name: 'reference_id',
    required: false,
    description: 'ID đơn hàng/phiếu liên quan (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'reference_type',
    required: false,
    description: 'Loại tham chiếu (PurchaseOrder, OrderReturn...)',
    enum: TransactionReferenceType,
  })
  @ApiQuery({
    name: 'reference_code',
    required: false,
    description: 'Mã tham chiếu (VD: PN00001)',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Phiếu chi đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy cửa hàng hoặc reference',
  })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @User() user: IUser,
    @Query('reference_id') referenceId?: string,
    @Query('reference_type') referenceType?: TransactionReferenceType,
    @Query('reference_code') referenceCode?: string,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Vui lòng chọn cửa hàng trước khi tạo phiếu chi',
      );
    }

    return this.financeService.createPayment(
      dto,
      user.storeId,
      user.id,
      referenceId,
      referenceType,
      referenceCode,
    );
  }
  // ========================================
  // TRANSACTION CRUD ENDPOINTS
  // ========================================

  /**
   * Lấy danh sách giao dịch
   * GET /finance/transactions
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách giao dịch',
    description: 'Lấy danh sách phiếu thu/chi với filter và pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách giao dịch',
  })
  async getTransactions(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'transaction_date', 'amount'],
      searchBy: ['code', 'contact_name', 'description'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        transaction_type: z.nativeEnum(transaction_type).optional(),
        transaction_source: z.nativeEnum(transaction_source).optional(),
        status: z.nativeEnum(transaction_status).optional(),
        payment_method: z.nativeEnum(payment_method).optional(),
        reference_type: z.nativeEnum(TransactionReferenceType).optional(),
        reference_code: z.string().optional(),
        contact_type: z.nativeEnum(contact_type).optional(),
        contact_id: z.string().uuid().optional(),
        transaction_date: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() user: IUser,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    const { data, total } = await this.financeService.getTransactions(
      user.storeId,
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  /**
   * Lấy chi tiết một giao dịch
   * GET /finance/transactions/:id
   */
  @Get('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy chi tiết giao dịch',
    description: 'Lấy thông tin chi tiết của một phiếu thu/chi',
  })
  @ApiParam({
    name: 'id',
    description: 'ID giao dịch',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin giao dịch',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giao dịch',
  })
  async getTransaction(@Param('id') id: string) {
    return this.financeService.getTransaction(id);
  }

  /**
   * Cập nhật giao dịch
   * PATCH /finance/transactions/:id
   */
  @Patch('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật giao dịch',
    description:
      'Cập nhật thông tin phiếu thu/chi (chỉ cho phép khi chưa bị hủy)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID giao dịch',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Giao dịch đã được cập nhật',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể cập nhật giao dịch đã bị hủy',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giao dịch',
  })
  async updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(id, dto);
  }

  /**
   * Hủy giao dịch
   * DELETE /finance/transactions/:id
   */
  @Delete('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy giao dịch',
    description:
      'Hủy phiếu thu/chi (chuyển status thành CANCELLED và cập nhật sổ quỹ)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID giao dịch',
    type: String,
  })
  @ApiQuery({
    name: 'cancelled_by',
    required: true,
    description: 'ID người hủy',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Giao dịch đã bị hủy',
  })
  @ApiResponse({
    status: 400,
    description: 'Giao dịch đã bị hủy trước đó',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giao dịch',
  })
  async cancelTransaction(
    @Param('id') id: string,
    @Query('cancelled_by') cancelledBy: string,
  ) {
    return this.financeService.cancelTransaction(id, cancelledBy);
  }

  /**
   * Duyệt giao dịch
   * POST /finance/transactions/:id/approve
   */
  @Post('transactions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Duyệt giao dịch',
    description:
      'Duyệt phiếu thu/chi (chuyển status thành CONFIRMED và cập nhật sổ quỹ)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID giao dịch',
    type: String,
  })
  @ApiQuery({
    name: 'approved_by',
    required: true,
    description: 'ID người duyệt',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Giao dịch đã được duyệt',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giao dịch',
  })
  async approveTransaction(
    @Param('id') id: string,
    @Query('approved_by') approvedBy: string,
  ) {
    return this.financeService.approveTransaction(id, approvedBy);
  }

  // ========================================
  // CASH BOOK ENDPOINTS (Sổ Quỹ)
  // ========================================

  /**
   * Lấy báo cáo sổ quỹ
   * GET /finance/cash-book
   */
  @Get('cash-book')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy báo cáo sổ quỹ',
    description:
      'Lấy sổ quỹ tiền mặt theo thời gian (số dư đầu kỳ, thu, chi, số dư cuối kỳ)',
  })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'ID cửa hàng',
    type: String,
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    description: 'Từ ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    description: 'Đến ngày (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Báo cáo sổ quỹ',
    schema: {
      example: {
        entries: [
          {
            id: 'uuid',
            store_id: 'uuid',
            date: '2025-02-01',
            opening_balance: '0',
            total_receipts: '500000',
            total_payments: '300000',
            closing_balance: '200000',
          },
        ],
        summary: {
          opening_balance: '0',
          total_receipts: '500000',
          total_payments: '300000',
          closing_balance: '200000',
        },
      },
    },
  })
  async getCashBook(@Query() query: CashBookQueryDto, @User() user: IUser) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    return this.financeService.getCashBook(user.storeId, query);
  }

  /**
   * Lấy số dư hiện tại
   * GET /finance/balance
   */
  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy số dư hiện tại',
    description: 'Lấy số dư quỹ tiền mặt hiện tại của cửa hàng',
  })
  @ApiQuery({
    name: 'store_id',
    required: true,
    description: 'ID cửa hàng',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Số dư hiện tại',
    schema: {
      example: {
        store_id: 'uuid',
        current_balance: '200000',
      },
    },
  })
  async getCurrentBalance(@User() user: IUser) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    const balance = await this.financeService.getCurrentBalance(user.storeId);
    return {
      store_id: user.storeId,
      current_balance: balance.toString(),
    };
  }
  // ========================================
  // ADVANCED QUERY ENDPOINTS
  // ========================================

  /**
   * Lấy danh sách phiếu thu
   * GET /finance/receipts
   */
  @Get('receipts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách phiếu thu',
    description: 'Lấy danh sách phiếu thu (RECEIPT) với filter và pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phiếu thu',
  })
  async getReceipts(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'transaction_date', 'amount'],
      searchBy: ['code', 'contact_name', 'description'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        // transaction_type disallowed or ignored, forced to RECEIPT
        transaction_source: z.nativeEnum(transaction_source).optional(),
        status: z.nativeEnum(transaction_status).optional(),
        payment_method: z.nativeEnum(payment_method).optional(),
        reference_type: z.nativeEnum(TransactionReferenceType).optional(),
        reference_code: z.string().optional(),
        contact_type: z.nativeEnum(contact_type).optional(),
        contact_id: z.string().uuid().optional(),
        transaction_date: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() user: IUser,
  ) {
    // Force transaction_type to RECEIPT
    query.prismaQuery.where = {
      ...query.prismaQuery.where,
      transaction_type: transaction_type.RECEIPT,
    };

    const { data, total } = await this.financeService.getTransactions(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  /**
   * Lấy danh sách phiếu chi
   * GET /finance/payments
   */
  @Get('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách phiếu chi',
    description: 'Lấy danh sách phiếu chi (PAYMENT) với filter và pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phiếu chi',
  })
  async getPayments(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'transaction_date', 'amount'],
      searchBy: ['code', 'contact_name', 'description'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        // transaction_type disallowed or ignored, forced to PAYMENT
        transaction_source: z.nativeEnum(transaction_source).optional(),
        status: z.nativeEnum(transaction_status).optional(),
        payment_method: z.nativeEnum(payment_method).optional(),
        reference_type: z.nativeEnum(TransactionReferenceType).optional(),
        reference_code: z.string().optional(),
        contact_type: z.nativeEnum(contact_type).optional(),
        contact_id: z.string().uuid().optional(),
        transaction_date: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() user: IUser,
  ) {
    // Force transaction_type to PAYMENT
    query.prismaQuery.where = {
      ...query.prismaQuery.where,
      transaction_type: transaction_type.PAYMENT,
    };

    const { data, total } = await this.financeService.getTransactions(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  // ========================================
  // STATISTICS ENDPOINTS
  // ========================================

  /**
   * Thống kê thu chi theo ngày
   * GET /finance/statistics/daily
   */
  @Get('statistics/daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thống kê thu chi theo ngày',
    description: 'Lấy thống kê thu/chi/số dư theo từng ngày',
  })
  @ApiQuery({ name: 'store_id', required: true, description: 'ID cửa hàng' })
  @ApiQuery({
    name: 'from_date',
    required: false,
    description: 'Từ ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    description: 'Đến ngày (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê theo ngày',
  })
  async getDailyStatistics(
    @Query() query: CashBookQueryDto,
    @User() user: IUser,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    return this.financeService.getDailyStatistics(user.storeId, query);
  }

  /**
   * Thống kê thu chi theo tháng
   * GET /finance/statistics/monthly
   */
  @Get('statistics/monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thống kê thu chi theo tháng',
    description: 'Lấy thống kê thu/chi/số dư theo từng tháng',
  })
  @ApiQuery({ name: 'store_id', required: true, description: 'ID cửa hàng' })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Năm (mặc định: năm hiện tại)',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê theo tháng',
  })
  async getMonthlyStatistics(
    @User() user: IUser,
    @Query('year') year?: number,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    return this.financeService.getMonthlyStatistics(
      user.storeId,
      year || new Date().getFullYear(),
    );
  }

  /**
   * Dashboard tổng quan tài chính
   * GET /finance/dashboard
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard tài chính',
    description:
      'Tổng quan tài chính: số dư, tổng thu/chi hôm nay, tuần này, tháng này',
  })
  @ApiQuery({ name: 'store_id', required: true, description: 'ID cửa hàng' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
  })
  async getDashboard(@User() user: IUser) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    return this.financeService.getDashboard(user.storeId);
  }

  // ========================================
  // UTILITY/ADMIN ENDPOINTS
  // ========================================

  /**
   * Sync lại sổ quỹ
   * POST /finance/sync-cash-book
   */
  @Post('sync-cash-book')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync lại sổ quỹ',
    description:
      'Tính toán lại sổ quỹ cho khoảng thời gian (dùng khi có sai lệch)',
  })
  @ApiQuery({ name: 'store_id', required: true, description: 'ID cửa hàng' })
  @ApiQuery({
    name: 'from_date',
    required: true,
    description: 'Từ ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to_date',
    required: true,
    description: 'Đến ngày (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sổ quỹ đã được sync',
  })
  async syncCashBook(
    @User() user: IUser,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    await this.financeService.syncCashBookRange(
      user.storeId,
      new Date(fromDate),
      new Date(toDate),
    );
    return {
      message: 'Sổ quỹ đã được đồng bộ thành công',
      store_id: user.storeId,
      from_date: fromDate,
      to_date: toDate,
    };
  }

  /**
   * Export danh sách giao dịch ra Excel
   * GET /finance/transactions/export
   */
  @Get('excel/transactions/export')
  @ApiOperation({
    summary: 'Export giao dịch ra Excel',
    description: 'Tải xuống danh sách giao dịch dưới dạng file Excel',
  })
  @ApiResponse({
    status: 200,
    description: 'File Excel',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  async exportTransactions(@User() user: IUser, @Res() res: Response) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    const buffer = await this.financeService.exportTransactions(user.storeId);

    const fileName = `danh_sach_giao_dich_${new Date().toISOString()}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }
  /**
   * Export sổ quỹ ra Excel
   * GET /finance/cash-book/export
   */
  @Get('cash-book/export')
  @ApiOperation({
    summary: 'Export sổ quỹ ra Excel',
    description: 'Tải xuống báo cáo sổ quỹ dưới dạng file Excel',
  })
  @ApiResponse({
    status: 200,
    description: 'File Excel',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  async exportCashBook(
    @Query() query: CashBookQueryDto,
    @User() user: IUser,
    @Res() res: Response,
  ) {
    if (!user.storeId) {
      throw new BadRequestException(
        'Không xác định được cửa hàng của người dùng',
      );
    }
    const buffer = await this.financeService.exportCashBook(
      user.storeId,
      query,
    );

    const fileName = `so_quy_tien_mat_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }
}
