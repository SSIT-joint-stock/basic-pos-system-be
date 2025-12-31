import { Controller, Get, Param, Res } from '@nestjs/common';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import { ExportReportService } from 'app/module/report/export-report.service';
import express from 'express';
import z from 'zod';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
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
        q: z.string().optional(), // ⬅️ thêm q vào schema
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
    const { data, total } = await this.reportService.getReportSuppliers(
      user.storeId || '',
      query.prismaQuery,
    );
    return PaginatedResponse.from(data, query.page, query.limit, total, '');
  }

  // excel
  @Get('/excel/suppliers')
  async exportExcelSuppliers(
    @Res() res: express.Response,
    @Param('storeId') storeId: string,
  ) {
    const buffer = await this.excel.exportReportSuppliers(storeId);
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
