import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';

// DTOs
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { CashBookQueryDto } from './dto/cash-book-query.dto';

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
    description: 'Không tìm thấy cửa hàng',
  })
  async createReceipt(@Body() dto: CreateReceiptDto) {
    return this.financeService.createReceipt(dto);
  }

  // ========================================
  // PAYMENT ENDPOINTS (Phiếu Chi)
  // ========================================

  /**
   * Tạo phiếu chi mới
   * POST /finance/payments
   */
  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo phiếu chi mới',
    description: 'Tạo phiếu chi tiền mặt ra khỏi quỹ (PC00001, PC00002...)',
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
    description: 'Không tìm thấy cửa hàng',
  })
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.financeService.createPayment(dto);
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
  @ApiQuery({
    name: 'store_id',
    required: false,
    description: 'Filter theo cửa hàng',
  })
  @ApiQuery({
    name: 'transaction_type',
    required: false,
    enum: ['RECEIPT', 'PAYMENT'],
    description: 'Filter theo loại (RECEIPT hoặc PAYMENT)',
  })
  @ApiQuery({
    name: 'transaction_source',
    required: false,
    description: 'Filter theo nguồn phát sinh',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    description: 'Filter theo trạng thái',
  })
  @ApiQuery({
    name: 'payment_method',
    required: false,
    description: 'Filter theo phương thức thanh toán',
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo mã, tên người liên hệ, hoặc mô tả',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng bản ghi mỗi trang (mặc định: 20)',
  })
  async getTransactions(@Query() query: QueryTransactionDto) {
    return this.financeService.getTransactions(query);
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
  async getCashBook(@Query() query: CashBookQueryDto) {
    return this.financeService.getCashBook(query);
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
  async getCurrentBalance(@Query('store_id') storeId: string) {
    const balance = await this.financeService.getCurrentBalance(storeId);
    return {
      store_id: storeId,
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
  async getReceipts(@Query() query: QueryTransactionDto) {
    // Force transaction_type to RECEIPT
    const receiptQuery = { ...query, transaction_type: 'RECEIPT' as const };
    return this.financeService.getTransactions(receiptQuery);
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
  async getPayments(@Query() query: QueryTransactionDto) {
    // Force transaction_type to PAYMENT
    const paymentQuery = { ...query, transaction_type: 'PAYMENT' as const };
    return this.financeService.getTransactions(paymentQuery);
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
  async getDailyStatistics(@Query() query: CashBookQueryDto) {
    return this.financeService.getDailyStatistics(query);
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
    @Query('store_id') storeId: string,
    @Query('year') year?: number,
  ) {
    return this.financeService.getMonthlyStatistics(
      storeId,
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
  async getDashboard(@Query('store_id') storeId: string) {
    return this.financeService.getDashboard(storeId);
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
    @Query('store_id') storeId: string,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    await this.financeService.syncCashBookRange(
      storeId,
      new Date(fromDate),
      new Date(toDate),
    );
    return {
      message: 'Sổ quỹ đã được đồng bộ thành công',
      store_id: storeId,
      from_date: fromDate,
      to_date: toDate,
    };
  }

  /**
   * Export danh sách giao dịch ra Excel
   * GET /finance/transactions/export
   */
  @Get('transactions/export')
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
  async exportTransactions(
    @Query() query: QueryTransactionDto,
    @Res() res: Response,
  ) {
    const buffer = await this.financeService.exportTransactions(query);

    const fileName = `danh_sach_giao_dich_${new Date().toISOString().split('T')[0]}.xlsx`;

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
  async exportCashBook(@Query() query: CashBookQueryDto, @Res() res: Response) {
    const buffer = await this.financeService.exportCashBook(query);

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
