import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  PRODUCT_VARIANT_EXCEL_TEMPLATE,
  ProductVariantExcel,
} from 'app/shared/excel-template/template/product-variant';

@Injectable()
export class ProductExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelTemplateService,
    private readonly format: Format,
  ) {}
  async downloadTemplateProduct() {
    return this.excelService.generateTemplateExample(
      PRODUCT_VARIANT_EXCEL_TEMPLATE,
    );
  }
  async exportProductExcel(storeId: string) {
    const variants = await this.prisma.variant.findMany({
      where: {
        product: {
          store_id: storeId,
        },
      },
      include: {
        variant_stocks: true,
        product: {
          include: {
            categories: true,
          },
        },
        conversions: true,
      },
    });

    const data = variants.map((variant) => ({
      // ===== Thông tin sản phẩm =====
      product_name: variant.product.name,
      product_sku: variant.product.sku,
      base_unit: variant.product.baseUnit,
      category_name: variant.product.categories
        .map((category) => category.name)
        .join(', '),
      description: variant.product.description,
      variant_name: variant.name,
      variant_sku: variant.sku,
      barcode: variant.barcode,
      price: this.format.formatCurrency(variant.price),
      cost: this.format.formatCurrency(variant.cost),
      quantity: variant.variant_stocks.reduce(
        (total, stock) => total + stock.onHand,
        0,
      ),
    }));

    return this.excelService.exportData(PRODUCT_VARIANT_EXCEL_TEMPLATE, data);
  }
  async checkValidationImportProduct(
    file: Express.Multer.File,
    storeId: string,
  ) {
    // 1. Đọc dữ liệu từ Excel
    const data = await this.excelService.importData<ProductVariantExcel>(
      PRODUCT_VARIANT_EXCEL_TEMPLATE,
      file,
    );

    const variantSkus = data
      .map((item) => item.variant_sku)
      .filter((sku): sku is string => !!sku);

    // 2. Kiểm tra các SKU đã tồn tại trong DB
    const existingVariants = await this.prisma.variant.findMany({
      where: {
        sku: { in: variantSkus },
        product: { store_id: storeId },
      },
      select: { sku: true },
    });

    const variantMap = new Map(existingVariants.map((v) => [v.sku, v]));

    // 3. Map kết quả kèm thông báo lỗi
    const result = data.map((item) => {
      const errors = this.validateImportItem(item, variantMap);

      return {
        ...item,
        isStatus: errors.length === 0,
        msg: errors.join(' | '),
      };
    });

    const itemLength = data.length;
    const itemErrorLength = result.filter((i) => !i.isStatus).length;
    const itemValidLength = itemLength - itemErrorLength;

    return {
      result,
      itemLength,
      itemErrorLength,
      itemValidLength,
    };
  }

  async importProduct(file: Express.Multer.File, storeId: string) {
    const { result } = await this.checkValidationImportProduct(file, storeId);
    const validItems = result.filter((item) => item.isStatus);
    // TODO: Implement save logic to DB using validItems
    return validItems;
  }

  private validateImportItem(
    item: ProductVariantExcel,
    variantMap: Map<string, { sku: string | null }>,
  ): string[] {
    const errors: string[] = [];

    // Kiểm tra SKU biến thể trùng lặp trong hệ thống
    if (item.variant_sku && variantMap.has(item.variant_sku)) {
      errors.push(`Mã biến thể (SKU) ${item.variant_sku} đã tồn tại.`);
    }

    // Validate số lượng, giá (vì Zod đang để string.nonempty)
    const price = Number(item.price);
    if (isNaN(price) || price < 0) {
      errors.push('Giá bán không hợp lệ.');
    }

    if (item.cost) {
      const cost = Number(item.cost);
      if (isNaN(cost) || cost < 0) {
        errors.push('Giá vốn không hợp lệ.');
      }
    }

    if (item.quantity) {
      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity < 0) {
        errors.push('Số lượng tồn không hợp lệ.');
      }
    }

    return errors;
  }
}
