import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { INVENTORY_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/inventory';

@Injectable()
export class VariantExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelTemplateService,
    private readonly status: FormatStatus,
    private readonly format: Format,
  ) {}
  async exportInventory(storeId: string) {
    const variants = await this.prisma.variant.findMany({
      where: {
        product: {
          store_id: storeId,
          is_deleted: false,
        },
      },
      include: {
        variant_stocks: {
          where: {
            store_id: storeId,
          },
        },
        product: true,
        conversions: true,
      },
    });

    const data = variants.map((variant) => ({
      // ===== Thông tin sản phẩm =====
      product_sku: variant.product.sku,
      product_name: variant.product.name,
      base_unit: variant.product.baseUnit,
      product_status: this.status.productStatus(variant.product.product_status),
      variant_name: variant.name,
      variant_sku: variant.sku,
      variant_barcode: variant.barcode,
      variant_unit:
        variant.conversions
          .map(
            (conversion) =>
              conversion.name +
              ' ' +
              conversion.factor +
              'x' +
              variant.product.baseUnit,
          )
          .join(', ') || 'Không có đơn vị quy đổi',
      variant_price: this.format.formatCurrency(variant.price),
      variant_cost: this.format.formatCurrency(variant.cost),
      variant_stock: variant.variant_stocks.reduce(
        (total, stock) => total + stock.onHand,
        0,
      ),
    }));

    return this.excelService.exportData(INVENTORY_EXCEL_TEMPLATE, data);
  }
}
