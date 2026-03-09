import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  PRODUCT_VARIANT_EXCEL_TEMPLATE,
  ProductVariantExcel,
} from 'app/shared/excel-template/template/product-variant';

import { BadRequestError } from 'app/common/response';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';
import { ImportExcelProductDto } from './dto/import-product-by-excel.dto';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

@Injectable()
export class ProductExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelTemplateService,
    private readonly format: Format,
    private readonly generateProductSku: GenerateProductSkuUseCase,
    private readonly generateVariantSku: GenerateVariantSkuUseCase,
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
          is_deleted: false,
        },
      },
      include: {
        variant_stocks: {
          where: {
            store_id: storeId,
          },
        },
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

    // 2. Thu thập dữ liệu để kiểm tra trùng lặp
    const productSkus = data
      .map((item) => item.product_sku)
      .filter((sku): sku is string => !!sku);
    const variantSkus = data
      .map((item) => item.variant_sku)
      .filter((sku): sku is string => !!sku);
    const barcodes = data
      .map((item) => item.barcode)
      .filter((bc): bc is string => !!bc);

    // 3. Kiểm tra các dữ liệu đã tồn tại trong DB cho cửa hàng này
    const [existingProducts, existingVariants] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          store_id: storeId,
          sku: { in: productSkus },
          is_deleted: false,
        },
        select: { sku: true, id: true, name: true },
      }),
      this.prisma.variant.findMany({
        where: {
          product: { store_id: storeId, is_deleted: false },
          OR: [{ sku: { in: variantSkus } }, { barcode: { in: barcodes } }],
        },
        include: {
          product: {
            select: { id: true, sku: true, name: true },
          },
        },
      }),
    ]);

    const existingProductSkuMap = new Map<string, (typeof existingProducts)[0]>(
      existingProducts
        .filter((p): p is typeof p & { sku: string } => p.sku !== null)
        .map((p) => [p.sku, p]),
    );
    const existingVariantSkuMap = new Map<string, (typeof existingVariants)[0]>(
      existingVariants
        .filter((v): v is typeof v & { sku: string } => v.sku !== null)
        .map((v) => [v.sku, v]),
    );
    const existingBarcodeMap = new Map<string, (typeof existingVariants)[0]>(
      existingVariants
        .filter((v): v is typeof v & { barcode: string } => v.barcode !== null)
        .map((v) => [v.barcode, v]),
    );

    // Map để kiểm tra Tên biến thể đã tồn tại trong Sản phẩm (nếu sản phẩm đã có trong DB)
    // Key: product_sku (ưu tiên) hoặc product_name
    const existingProductVariantNamesMap = new Map<string, Set<string>>();

    // Fetch thêm variant names cho các sản phẩm trùng SKU hoặc tên trong data
    const productNames = data.map((item) => item.product_name);
    const productsWithVariants = await this.prisma.product.findMany({
      where: {
        store_id: storeId,
        is_deleted: false,
        OR: [{ sku: { in: productSkus } }, { name: { in: productNames } }],
      },
      include: { variant: { select: { name: true } } },
    });

    productsWithVariants.forEach((p) => {
      const names = new Set(p.variant.map((v) => v.name));
      if (p.sku) existingProductVariantNamesMap.set(p.sku, names);
      existingProductVariantNamesMap.set(p.name, names);
    });

    // Theo dõi trùng lặp ngay trong file Excel đang import
    const importedVariantSkus = new Set<string>();
    const importedBarcodes = new Set<string>();
    const importedProductVariantNames = new Map<string, Set<string>>();

    // 4. Map kết quả kèm thông báo lỗi
    const result = data.map((item) => {
      const { errors, warnings } = this.validateImportItem(
        item,
        existingProductSkuMap,
        existingVariantSkuMap,
        existingBarcodeMap,
        existingProductVariantNamesMap,
        importedVariantSkus,
        importedBarcodes,
        importedProductVariantNames,
      );

      // Lưu lại thông tin đã check để validate các dòng sau trong file Excel
      if (item.variant_sku) importedVariantSkus.add(item.variant_sku);
      if (item.barcode) importedBarcodes.add(item.barcode);

      const productKey = item.product_sku || item.product_name;
      if (!importedProductVariantNames.has(productKey)) {
        importedProductVariantNames.set(productKey, new Set());
      }
      const variantName = item.variant_name || item.product_name;
      importedProductVariantNames.get(productKey)?.add(variantName);

      const allMsgs = [...errors];
      if (warnings.length > 0) {
        allMsgs.push(...warnings.map((w) => `[Lưu ý] ${w}`));
      }

      return {
        ...item,
        isStatus: errors.length === 0,
        msg: allMsgs.join(' | '),
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

  async importProduct(
    dto: ImportExcelProductDto,
    storeId: string,
    userId: string,
  ) {
    const validItems = dto.items.filter((item) => item.isStatus);

    if (validItems.length === 0) {
      throw new BadRequestError('Không có bản ghi nào hợp lệ để lưu.');
    }

    // Nhóm các bản ghi theo sản phẩm (dựa trên SKU hoặc Tên)
    const itemsByProduct = new Map<string, typeof validItems>();
    validItems.forEach((item) => {
      const key = item.product_sku || item.product_name;
      if (!itemsByProduct.has(key)) itemsByProduct.set(key, []);
      itemsByProduct.get(key)?.push(item);
    });

    await this.prisma.$transaction(async (tx) => {
      // Đếm số lượng SKU cần tạo
      let neededProductSkus = 0;
      let neededVariantSkus = 0;

      for (const [, items] of itemsByProduct.entries()) {
        const firstItem = items[0];
        if (!firstItem.product_sku) neededProductSkus++;
        for (const item of items) {
          if (!item.variant_sku) neededVariantSkus++;
        }
      }

      // Tạo SKU hàng loạt
      const generatedProductSkus =
        neededProductSkus > 0
          ? await this.generateProductSku.generateSkuBatchWithTransaction(
              tx,
              storeId,
              neededProductSkus,
            )
          : [];
      const generatedVariantSkus =
        neededVariantSkus > 0
          ? await this.generateVariantSku.generateSkuVariantBatchWithTransaction(
              tx,
              storeId,
              neededVariantSkus,
            )
          : [];

      let productSkuIndex = 0;
      let variantSkuIndex = 0;

      for (const [, items] of itemsByProduct.entries()) {
        const firstItem = items[0];

        // 1. Xử lý Category
        let categoryId: string | undefined;
        if (firstItem.category_name) {
          let category = await tx.category.findFirst({
            where: {
              store_id: storeId,
              name: firstItem.category_name,
            },
          });
          if (!category) {
            category = await tx.category.create({
              data: {
                store_id: storeId,
                name: firstItem.category_name,
              },
            });
          }
          categoryId = category.id;
        }

        // 2. Xử lý Product
        const productSku =
          firstItem.product_sku || generatedProductSkus[productSkuIndex++];
        const product = await tx.product.upsert({
          where: {
            store_id_sku: {
              store_id: storeId,
              sku: productSku,
            },
          },
          create: {
            store_id: storeId,
            name: firstItem.product_name,
            sku: productSku,
            baseUnit: firstItem.base_unit,
            description: firstItem.description,
            created_by: userId,
            categories: categoryId
              ? { connect: { id: categoryId } }
              : undefined,
          },
          update: {
            name: firstItem.product_name,
            baseUnit: firstItem.base_unit,
            description: firstItem.description,
            categories: categoryId
              ? { connect: { id: categoryId } }
              : undefined,
          },
        });

        // 3. Xử lý các Variants
        for (const item of items) {
          const variantName = item.variant_name || item.product_name;
          const variantSku =
            item.variant_sku || generatedVariantSkus[variantSkuIndex++];
          const variant = await tx.variant.upsert({
            where: {
              product_id_name: {
                product_id: product.id,
                name: variantName,
              },
            },
            create: {
              product_id: product.id,
              name: variantName,
              sku: variantSku,
              barcode: item.barcode,
              price: Number(item.price),
              cost: item.cost ? Number(item.cost) : 0,
            },
            update: {
              sku: variantSku,
              barcode: item.barcode,
              price: Number(item.price),
              cost: item.cost ? Number(item.cost) : 0,
            },
          });

          // 4. Xử lý Stock (giữ nguyên)
          if (item.quantity !== undefined && item.quantity !== null) {
            await tx.variantStock.upsert({
              where: {
                variant_id_store_id: {
                  variant_id: variant.id,
                  store_id: storeId,
                },
              },
              create: {
                variant_id: variant.id,
                store_id: storeId,
                onHand: Number(item.quantity),
              },
              update: {
                onHand: Number(item.quantity),
              },
            });
          }
        }
      }
    });

    return {
      count: validItems.length,
      message: `Đã lưu thành công ${validItems.length} bản ghi.`,
    };
  }

  private validateImportItem(
    item: ProductVariantExcel,
    existingProductSkuMap: Map<string, any>,
    existingVariantSkuMap: Map<string, any>,
    existingBarcodeMap: Map<string, any>,
    existingProductVariantNamesMap: Map<string, Set<string>>,
    importedVariantSkus: Set<string>,
    importedBarcodes: Set<string>,
    importedProductVariantNames: Map<string, Set<string>>,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Kiểm tra SKU Sản phẩm (Product SKU)
    if (item.product_sku && existingProductSkuMap.has(item.product_sku)) {
      errors.push(`Mã sản phẩm (SKU) ${item.product_sku} đã tồn tại.`);
    }

    if (!item.product_sku) {
      warnings.push('Mã sản phẩm (SKU) trống, hệ thống sẽ tự động tạo mã.');
    }

    // 2. Kiểm tra SKU Biến thể (Variant SKU)
    if (item.variant_sku) {
      if (existingVariantSkuMap.has(item.variant_sku)) {
        errors.push(`Mã biến thể (SKU) ${item.variant_sku} đã tồn tại.`);
      }
      if (importedVariantSkus.has(item.variant_sku)) {
        errors.push(
          `Mã biến thể (SKU) ${item.variant_sku} bị trùng lặp trong file.`,
        );
      }
    }

    if (!item.variant_sku) {
      warnings.push('Mã biến thể (SKU) trống, hệ thống sẽ tự động tạo mã.');
    }

    // 3. Kiểm tra Barcode (Mã vạch)
    if (item.barcode) {
      if (existingBarcodeMap.has(item.barcode)) {
        errors.push(`Mã vạch (Barcode) ${item.barcode} đã tồn tại.`);
      }
      if (importedBarcodes.has(item.barcode)) {
        errors.push(
          `Mã vạch (Barcode) ${item.barcode} bị trùng lặp trong file.`,
        );
      }
    }

    // 4. Kiểm tra Tên biến thể (Variant Name) trong cùng sản phẩm
    const productKey = item.product_sku || item.product_name;
    const variantName = item.variant_name || item.product_name;

    if (!item.variant_name) {
      warnings.push(
        `Thiếu tên biến thể, hệ thống sẽ sử dụng tên sản phẩm "${item.product_name}" làm tên biến thể mặc định.`,
      );
    }

    const existingNames = existingProductVariantNamesMap.get(productKey);
    if (existingNames && existingNames.has(variantName)) {
      errors.push(`Tên biến thể "${variantName}" đã tồn tại trong sản phẩm.`);
    }

    const importedNames = importedProductVariantNames.get(productKey);
    if (importedNames && importedNames.has(variantName)) {
      errors.push(
        `Tên biến thể "${variantName}" bị trùng lặp trong file cho sản phẩm này.`,
      );
    }

    // 5. Validate số lượng, giá
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

    return { errors, warnings };
  }
}
