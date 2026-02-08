import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';

export interface PurchaseOrderItemInput {
  variant_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  unit?: string;
  discount_rate?: number;
  tax_rate?: number;
  notes?: string;
}

export interface CalculatedPurchaseItem {
  product_id: string;
  variant_id: string;
  item_name: string;
  quantity: Prisma.Decimal;
  unit_cost: Prisma.Decimal;
  unit: string;
  applied_factor: number;
  total_base_qty: number;
  discount_rate: Prisma.Decimal;
  tax_rate: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  discount_amount: Prisma.Decimal;
  tax_amount: Prisma.Decimal;
  total: Prisma.Decimal;
  notes: string | null;
}

@Injectable()
export class PurchasePriceUseCase {
  private readonly errMsg = {
    UNIT_NOT_FOUND: 'Đơn vị quy đổi không tìm thấy trong sản phẩm',
  };

  calculateItem(
    item: PurchaseOrderItemInput,
    variant: {
      id: string;
      name: string;
      product: { baseUnit: string; id: string };
      conversions: { name: string; factor: number }[];
    },
  ): CalculatedPurchaseItem {
    const { product } = variant;
    let appliedFactor = 1;

    // Handle unit conversion
    if (item.unit && item.unit !== product.baseUnit) {
      const conversion = variant.conversions.find(
        (c) => c.name.toLowerCase() === item.unit?.toLowerCase(),
      );
      if (!conversion) {
        throw new NotFoundError(`${this.errMsg.UNIT_NOT_FOUND}: ${item.unit}`);
      }
      appliedFactor = conversion.factor;
    }

    const inputQty = new Prisma.Decimal(item.quantity);
    const appliedFactorDecimal = new Prisma.Decimal(appliedFactor);
    const baseQty = inputQty.mul(appliedFactorDecimal);

    const cost = new Prisma.Decimal(item.unit_cost);
    const discount = new Prisma.Decimal(item.discount_rate || 0);
    const tax = new Prisma.Decimal(item.tax_rate || 0);

    const itemSubtotal = baseQty.mul(cost);
    const itemDiscount = itemSubtotal.mul(discount.div(100));
    const itemTax = itemSubtotal.sub(itemDiscount).mul(tax.div(100));
    const itemTotal = itemSubtotal.sub(itemDiscount).add(itemTax);

    return {
      product_id: item.product_id,
      variant_id: item.variant_id,
      item_name: variant.name,
      quantity: inputQty,
      unit_cost: cost,
      unit: item.unit ?? product.baseUnit,
      applied_factor: appliedFactor,
      total_base_qty: Number(baseQty),
      discount_rate: discount,
      tax_rate: tax,
      subtotal: itemSubtotal,
      discount_amount: itemDiscount,
      tax_amount: itemTax,
      total: itemTotal,
      notes: item.notes || null,
    };
  }
}
