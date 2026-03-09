import { Injectable } from '@nestjs/common';
import { payment_status, Prisma, purchase_order_status } from '@prisma/client';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { ImportExcelPurchaseDto } from 'app/module/purchase-order/dto/import-excel-purchase.dto';
import { GeneratePurchaseCodeUseCase } from 'app/module/purchase-order/use-case/genereate-order-number.usecase';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import {
  EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE,
  PurchaseOrderExcel,
} from 'app/shared/excel-template/template/example-purchase-order';
import { PURCHASE_ORDER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/purchase-order';
import { PurchasePriceUseCase } from 'app/shared/usecase/purchase-price.usecase';

@Injectable()
export class PurchaseOrderExcelService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly generateCode: GeneratePurchaseCodeUseCase,
    private readonly prisma: PrismaService,
    private readonly format: Format,
    private readonly status: FormatStatus,
    private readonly calculator: PurchasePriceUseCase,
  ) {}

  async downloadExamplePurchaseOrder() {
    return this.excelService.generateTemplateExample(
      EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE,
    );
  }

  async checkValidationImportPO(file: Express.Multer.File, storeId: string) {
    // 2. Đọc dữ liệu từ Excel
    const data = await this.excelService.importData(
      EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE,
      file,
    );
    const excelSkus = data
      .map((item: PurchaseOrderExcel) => item.sku)
      .filter(Boolean);

    // 3. Lấy thông tin biến thể (Variant) từ DB để có cả product_id và variant_id
    const variantsInDB = await this.prisma.variant.findMany({
      where: {
        sku: { in: excelSkus },
        product: { store_id: storeId, is_deleted: false }, // Đảm bảo thuộc store và chưa xóa
      },
      select: {
        id: true, // variant_id
        sku: true,
        name: true,
        product_id: true,
        product: {
          select: { name: true },
        },
      },
    });

    const variantMap = new Map(variantsInDB.map((v) => [v.sku, v]));

    // 4. Map kết quả trả về kèm thông báo lỗi chi tiết
    const result = data.map((item: PurchaseOrderExcel) => {
      const dbVariant = variantMap.get(item.sku);
      const errors = this.validateImportItem(item, dbVariant);

      return {
        ...item,
        isStatus: errors.length === 0,
        msg: errors.join(' | '),
        product_id: dbVariant?.product_id || null, // Map chính xác field
        variant_id: dbVariant?.id || null, // Map chính xác field
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

  async importPurchaseOrders(
    dto: ImportExcelPurchaseDto,
    user: IUser,
    storeId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra nhà cung cấp
      const supplier = await tx.supplier.findUnique({
        where: { id: dto.supplier_id, store_id: storeId },
      });
      if (!supplier) throw new NotFoundError(`Nhà cung cấp không tồn tại`);

      // 2. Lọc các item hợp lệ (isStatus: true)
      const validItems = dto.items.filter((item) => item.isStatus === true);
      if (validItems.length === 0)
        throw new BadRequestError(
          'Không có sản phẩm hợp lệ để nhập vào cửa hàng',
        );

      // 3. Lấy thông tin variant chi tiết để tính toán
      const variantIds = validItems.map((item) => item.variant_id);
      const variants = await tx.variant.findMany({
        where: {
          id: { in: variantIds },
          product: { is_deleted: false },
        },
        include: {
          product: true,
          conversions: true,
        },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 4. Tính toán tài chính chi tiết
      let subtotal = new Prisma.Decimal(0);
      let totalDiscount = new Prisma.Decimal(0);
      let totalTax = new Prisma.Decimal(0);
      const purchaseOrderItems: any[] = [];

      for (const item of validItems) {
        const variant = variantMap.get(item.variant_id);
        if (!variant) continue; // Should catch in validation but safe check

        // Use Calculator Service
        const calculatedItem = this.calculator.calculateItem(
          {
            ...item,
            unit: item.unit ?? undefined,
            discount_rate: item.discount_rate || 0,
            tax_rate: item.tax_rate || 0,
          },
          variant,
        );

        // Update Accessor Totals
        subtotal = subtotal.add(calculatedItem.subtotal);
        totalDiscount = totalDiscount.add(calculatedItem.discount_amount);
        totalTax = totalTax.add(calculatedItem.tax_amount);

        purchaseOrderItems.push({
          product_id: calculatedItem.product_id,
          variant_id: calculatedItem.variant_id,
          item_name: calculatedItem.item_name,
          quantity: calculatedItem.quantity,
          unit_cost: calculatedItem.unit_cost,
          unit: calculatedItem.unit,
          applied_factor: calculatedItem.applied_factor,
          total_base_qty: calculatedItem.total_base_qty,
          discount_rate: calculatedItem.discount_rate,
          tax_rate: calculatedItem.tax_rate,
          subtotal: calculatedItem.subtotal,
          discount_amount: calculatedItem.discount_amount,
          tax_amount: calculatedItem.tax_amount,
          total: calculatedItem.total,
          notes: calculatedItem.notes,
        });

        // Reserve Stock
        await tx.variantStock.update({
          where: {
            variant_id_store_id: {
              variant_id: item.variant_id,
              store_id: storeId,
            },
          },
          data: {
            reserved: {
              increment: calculatedItem.total_base_qty,
            },
          },
        });
      }

      const total = subtotal.sub(totalDiscount).add(totalTax);

      // 5. Tạo Purchase Order
      return await tx.purchaseOrder.create({
        data: {
          store_id: storeId,
          supplier_id: supplier.id,
          order_number: await this.generateCode.generateOrderNumber(storeId),
          order_date: dto.order_date || new Date(),
          status: purchase_order_status.PENDING,
          payment_status: payment_status.UNPAID,
          subtotal: subtotal,
          discount_amount: totalDiscount,
          tax_amount: totalTax,
          total: total,
          created_by: user.id,
          items: {
            createMany: {
              data: purchaseOrderItems,
            },
          },
        },
      });
    });
  }

  async exportPurchaseOrders(storeId: string) {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        store_id: storeId,
      },
      include: {
        supplier: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        order_date: 'desc',
      },
    });

    const data = purchaseOrders.map((po) => ({
      // ===== Thông tin phiếu nhập =====
      order_number: po.order_number,
      order_date: this.format.formatDate(po.order_date),
      expected_date: po.expected_date
        ? this.format.formatDate(po.expected_date)
        : '',
      received_date: po.received_date
        ? this.format.formatDate(po.received_date)
        : '',

      // ===== Nhà cung cấp =====
      supplier_code: po.supplier?.code ?? '',
      supplier_name: po.supplier?.name ?? '',

      // ===== Trạng thái =====
      status: this.status.purchaseOrderStatus(po.status),
      payment_status: this.status.paymentStatus(po.payment_status),
      payment_method: po.payment_method
        ? this.status.paymentMethod(po.payment_method)
        : '',

      // ===== Tài chính (GIỮ NGUYÊN NUMBER) =====
      subtotal: Number(po.subtotal),
      discount_amount: Number(po.discount_amount),
      tax_amount: Number(po.tax_amount),
      shipping_fee: Number(po.shipping_fee ?? 0),
      total: Number(po.total),
      paid_amount: Number(po.paid_amount),
      remain_amount: Number(po.total) - Number(po.paid_amount),

      // ===== Ghi chú =====
      notes: po.notes ?? '',
    }));

    return this.excelService.exportData(PURCHASE_ORDER_EXCEL_TEMPLATE, data);
  }

  private validateImportItem(
    item: PurchaseOrderExcel,
    dbProduct: { id: string; sku: string; name: string } | undefined,
  ): string[] {
    const errors: string[] = [];

    if (!dbProduct) {
      errors.push(`SKU ${item.sku} không tồn tại trong cửa hàng.`);
      return errors; // Nếu không tìm thấy sản phẩm, trả về lỗi ngay
    }

    // Kiểm tra lệch tên
    if (item.item_name?.trim() !== dbProduct.name.trim()) {
      errors.push(
        `Tên sản phẩm trong file không khớp trong cửa hàng (Cửa hàng: ${dbProduct.name} - File: ${item.item_name}).`,
      );
    }

    // Validate số lượng
    const quantity = Number(item.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      errors.push('Số lượng phải là số lớn hơn 0.');
    }

    // Validate đơn giá
    const unitCost = Number(item.unit_cost);
    if (isNaN(unitCost) || unitCost < 0) {
      errors.push('Giá nhập không hợp lệ.');
    }

    return errors;
  }
}
