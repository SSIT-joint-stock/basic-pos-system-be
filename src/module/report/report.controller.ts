import { Controller, Get } from '@nestjs/common';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { RequirePermission } from 'app/common/decorators/permission.decorator';
import { User } from 'app/common/decorators/user.decorator';
import { PaginatedResponse } from 'app/common/response';
import { PERMISSIONS } from 'app/common/types/permission.type';
import type { IUser } from 'app/common/types/user.type';
import z from 'zod';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

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
}
