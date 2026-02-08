import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { payment_status, purchase_order_status } from '@prisma/client';
import { ApiSuccess } from 'app/common/decorators';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { BadRequestError, PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import { ImportExcelPurchaseDto } from 'app/module/purchase-order/dto/import-excel-purchase.dto';
import express from 'express';
import z from 'zod';
import { AcceptPaymentImportPurchaseDto } from './dto/accept-payment-puchase.dto';
import { CreatePurchaseOrderDto } from './dto/purchase-order.dto';
import { PurchaseOrderExcelService } from './purchase-order-excel.service';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchasePaymentService } from './purchase-payment.service';

@Controller('purchase-order')
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchasePaymentService: PurchasePaymentService,
    private readonly excel: PurchaseOrderExcelService,
  ) {}
  @Post('')
  @ApiSuccess('Tạo đơn nhập hàng thành công!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_CREATE])
  async createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @User() user: IUser,
  ) {
    return await this.purchaseOrderService.createPurchaseOrder(
      user.storeId || '',
      dto,
      user,
    );
  }

  @Post('accept-payment/:id')
  @ApiSuccess('Xác nhận thanh toán đơn hàng thành công!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_UPDATE])
  async acceptPayment(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() dto: AcceptPaymentImportPurchaseDto,
  ) {
    return await this.purchasePaymentService.acceptPayment(
      user.storeId || '',
      id,
      dto,
    );
  }

  @Post('accept-import/:id')
  @ApiSuccess('Xác nhận nhập kho thành công!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_UPDATE])
  async acceptImport(@User() user: IUser, @Param('id') id: string) {
    return await this.purchaseOrderService.acceptPurchaseImport(
      id,
      user.storeId || '',
      user,
    );
  }

  @Get(':id')
  @RequirePermission([
    PERMISSIONS.PURCHASE_ORDER_READ,
    PERMISSIONS.PURCHASE_ORDER_ALL,
  ])
  async getPurchaseOrder(@User() user: IUser, @Param('id') id: string) {
    return await this.purchaseOrderService.getPurchaseOrder(
      id,
      user.storeId || '',
    );
  }

  @Get('order-number/:orderNumber')
  @RequirePermission([
    PERMISSIONS.PURCHASE_ORDER_READ,
    PERMISSIONS.PURCHASE_ORDER_ALL,
  ])
  async getPurchaseOrderByNumber(
    @User() user: IUser,
    @Param('orderNumber') orderNumber: string,
  ) {
    return await this.purchaseOrderService.getPurchaseOrderByNumber(
      user.storeId || '',
      orderNumber,
    );
  }

  @Get('')
  @ApiSuccess('Lấy toàn bộ đơn nhập hàng thành công!')
  @RequirePermission([
    PERMISSIONS.PURCHASE_ORDER_READ,
    PERMISSIONS.PURCHASE_ORDER_ALL,
  ])
  async getPurchaseOrders(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: [
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total',
        'shipping_fee',
        'createdAt',
      ],
      rangeFields: ['total', 'subtotal'],
      searchBy: ['order_number', 'supplier_code', 'supplier_name'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(), // ⬅️ thêm q vào schema
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        payment_status: z.enum(payment_status).optional(),
        status: z.enum(purchase_order_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total, summary } =
      await this.purchaseOrderService.getPurchaseOrders(
        storeId || '',
        query.prismaQuery,
      );
    return PaginatedResponse.from(
      data,
      query.page,
      query.limit,
      total,
      '',
      summary,
    );
  }

  @Get('supplier/:supplierId')
  @RequirePermission([
    PERMISSIONS.PURCHASE_ORDER_READ,
    PERMISSIONS.PURCHASE_ORDER_ALL,
  ])
  async getPurchaseOrdersBySupplier(
    @Param('supplierId') supplierId: string,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: [
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total',
        'shipping_fee',
        'createdAt',
      ],
      rangeFields: ['total', 'subtotal'],
      searchBy: ['order_number'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
        payment_status: z.enum(payment_status).optional(),
        status: z.enum(purchase_order_status).optional(),
      }),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total } =
      await this.purchaseOrderService.getPurchaseOrdersBySupplier(
        supplierId,
        storeId || '',
        query.prismaQuery,
      );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get('payment-history/')
  @ApiSuccess('Lấy lịch sử dụng thanh toán!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_READ])
  async getPaymentHistory(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      searchKey: 'q',
      schema: z.object({}),
    })
    query: FilterParseResult<any>,
    @User() { storeId }: IUser,
  ) {
    const { data, total } = await this.purchasePaymentService.getPaymentHistory(
      query.prismaQuery,
      storeId || '',
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @Get('payment-history/:id')
  @ApiSuccess('Lấy chi tiết lịch sử dụng thanh toán!')
  @RequirePermission([PERMISSIONS.PURCHASE_ORDER_READ])
  async getPaymentHistoryDetail(@Param('id') id: string, @User() user: IUser) {
    return await this.purchasePaymentService.getPaymentSummary(
      id,
      user?.storeId || '',
    );
  }

  @Post('excel/import/validation')
  @UseInterceptors(FileInterceptor('po_validation'))
  @ApiSuccess('Lấy file nhập hàng thành công!')
  async validationImportPO(
    @User() { storeId }: IUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /(spreadsheet|excel|vnd.openxmlformats)/,
          }),

          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!storeId)
      throw new BadRequestError('Lỗi khi tìm cửa hàng. Vui lòng đăng nhập lại');
    return await this.excel.checkValidationImportPO(file, storeId);
  }

  @Post('excel/import/save')
  @ApiSuccess('Nhập hàng thành công!')
  async importPO(@Body() dto: ImportExcelPurchaseDto, @User() user: IUser) {
    return await this.excel.importPurchaseOrders(dto, user, user.storeId || '');
  }

  @Get('excel/template')
  async downloadPurchaseOrderTemplate(@Res() res: express.Response) {
    const buffer = await this.excel.downloadExamplePurchaseOrder();

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=phieu_nhap_hang.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }

  @Get('/excel/export/')
  async exportPurchaseOrdersExcel(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excel.exportPurchaseOrders(storeId);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=phieu_nhap_hang.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.end(buffer);
  }
}
