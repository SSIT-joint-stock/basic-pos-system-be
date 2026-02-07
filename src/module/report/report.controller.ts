import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import { ReportCustomerService } from 'app/module/report/customer/report-customer.service';
import { ExportReportService } from 'app/module/report/export-report.service';
import { ReportSalesService } from 'app/module/report/sales/report-sales.service';
import { ReportSupplierService } from 'app/module/report/supplier/report-supplier.service';
import express from 'express';
import z from 'zod';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportCustomer: ReportCustomerService,
    private readonly reportSupplier: ReportSupplierService,
    private readonly reportSales: ReportSalesService,
    private readonly excel: ExportReportService,
  ) {}

  @RequirePermission([PERMISSIONS.REPORT_READ])
  @Get('suppliers')
  async getReportSuppliers(
    @User() user: IUser,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'total_purchased', 'name', 'code'],
      searchBy: ['name', 'code', 'email', 'phone', 'tax_code'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } = await this.reportSupplier.getReportSuppliers(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @RequirePermission([PERMISSIONS.REPORT_READ])
  @Get('supplier/:supplierId')
  async getReportSupplier(
    @Param('supplierId') supplierId: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @User() user: IUser,
  ) {
    if (!user.storeId) return [];
    return this.reportSupplier.getReportSupplierDetail(
      user.storeId,
      supplierId,
    );
  }

  @RequirePermission([PERMISSIONS.REPORT_READ])
  @Get('customers')
  async getReportCustomer(
    @User() user: IUser,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt'],
      searchBy: ['name', 'email', 'phone'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } = await this.reportCustomer.getReportCustomers(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  @RequirePermission([PERMISSIONS.REPORT_READ])
  @Get('sales')
  async getReportSales(
    @User() user: IUser,
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'code'],
      searchBy: ['code', 'customer_name'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
  ) {
    const { data, total } = await this.reportSales.getReportSales(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  // excel
  @Get('/excel/suppliers')
  async exportExcelSuppliers(
    @Res() res: express.Response,
    @User() user: IUser,
  ) {
    const buffer = await this.excel.exportReportSuppliers(user.storeId || '');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }

  @Get('/excel/customers')
  async exportExcelCustomers(
    @Res() res: express.Response,
    @User() user: IUser,
  ) {
    const buffer = await this.excel.exportReportCustomers(user.storeId || '');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }

  @Get('/excel/sales')
  async exportExcelSales(@Res() res: express.Response, @User() user: IUser) {
    const buffer = await this.excel.exportReportSales(user.storeId || '');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-report.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
