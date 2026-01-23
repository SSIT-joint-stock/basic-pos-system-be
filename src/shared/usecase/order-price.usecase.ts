import { Injectable } from '@nestjs/common';
import { OrderItem } from '@prisma/client';

@Injectable()
export class PricingService {
  calcLineItem(input: {
    price: number;
    quantity: number;
    discountRate?: number;
    taxRate?: number;
  }) {
    const subtotal = input.price * input.quantity;
    const discount = subtotal * ((input.discountRate || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * ((input.taxRate || 0) / 100);

    return {
      subtotal_amount: Math.round(subtotal),
      discount_amount: Math.round(discount),
      tax_amount: Math.round(tax),
      total_amount: Math.round(afterDiscount + tax),
      quantity: input.quantity,
    };
  }

  calcOrderTotals(items: Parameters<typeof this.calcLineItem>[0][]) {
    const lineItems = items.map((i) => this.calcLineItem(i));

    return {
      subtotal_amount: lineItems.reduce((s, i) => s + i.subtotal_amount, 0),
      discount_amount: lineItems.reduce((s, i) => s + i.discount_amount, 0),
      tax_amount: lineItems.reduce((s, i) => s + i.tax_amount, 0),
      total_amount: lineItems.reduce((s, i) => s + i.total_amount, 0),
      lineItems,
    };
  }

  calcReturnItemTotal(orderItem: OrderItem, returnQty: number) {
    const unitTotal = orderItem.total / orderItem.quantity;
    return Math.round(unitTotal * returnQty);
  }

  calcSuggestRefund(returnTotal: number, customerPaid: number) {
    return Math.min(returnTotal, customerPaid);
  }
}
