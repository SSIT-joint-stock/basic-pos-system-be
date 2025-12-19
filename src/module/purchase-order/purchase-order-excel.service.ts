import { Injectable } from '@nestjs/common';
// import { Format } from 'app/common/helpers/format';
// import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { PURCHASE_ORDER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/purchase-order';

@Injectable()
export class PurchaseOrderExcelService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
    // private readonly format: Format,
    // private readonly status: FormatStatus,
  ) {}
  async downloadExamplePurchaseOrder() {
    return this.excelService.generateTemplateExample(
      PURCHASE_ORDER_EXCEL_TEMPLATE,
    );
  }
}
