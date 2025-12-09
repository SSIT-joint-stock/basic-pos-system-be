import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { StockMovementService } from '../stock-movement/stock-movement.service';
import { NotFoundError } from 'app/common/response';
import {
  Prisma,
  purchase_order_status,
  stock_movement_type,
} from '@prisma/client';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCode: GeneratePurchaseCodeUseCase,
    private readonly stock_movement: StockMovementService,
  ) {}
  private readonly errMsg = {
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại trong kho',
    INVALID_ITEM_DATA: 'Không có sản phẩm trong đơn nhập. Vui lòng thử lại',
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng',
    SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp',
    PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy đơn nhập hàng',
  };

  // Gồm 3 bước trong document bao gồm: khởi tạo đơn mua, thêm chi tiết sản phẩm, gửi duyệt
  // async createPurchaseOrder(
  //   storeId: string,
  //   dto: CreatePurchaseOrderDto,
  //   user: IUser,
  // ) {
  //   return this.prisma.$transaction(async (tx) => {
  //     const { items } = dto;
  //     if (!items.length) {
  //       throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
  //     }
  //     const purchaseOrderItems: PurchaseOrderItem[] = [];
  //     let subtotal = new Prisma.Decimal(0);
  //     let totalDiscount = new Prisma.Decimal(0);
  //     let totalTax = new Prisma.Decimal(0);
  //     const store = await tx.store.findUnique({
  //       where: {
  //         id: storeId,
  //       },
  //     });

  //     if (!store) {
  //       throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
  //     }
  //     const supplier = await tx.supplier.findUnique({
  //       where: {
  //         id: dto.supplier_id,
  //         store_id: storeId,
  //       },
  //     });

  //     if (!supplier) {
  //       throw new NotFoundError(this.errMsg.SUPPLIER_NOT_FOUND);
  //     }
  //     const productIds = dto.items
  //       .filter((item) => item.product_id !== undefined)
  //       .map((item) => item.product_id!);
  //     const products = await tx.product.findMany({
  //       where: {
  //         id: {
  //           in: productIds,
  //         },
  //         store_id: storeId,
  //       },
  //     });
  //     const productMap = new Map(products.map((p) => [p.id, p]));
  //     for (const item of items) {
  //       const {
  //         product_id,
  //         quantity,
  //         tax_rate,
  //         discount_rate,
  //         notes,
  //         unit_cost,
  //       } = item;

  //       if (!product_id) {
  //         throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
  //       }
  //       if (!productMap.has(product_id)) {
  //         throw new NotFoundError(this.errMsg.PRODUCT_NOT_FOUND);
  //       }
  //       const qty = new Prisma.Decimal(quantity);
  //       const cost = new Prisma.Decimal(unit_cost);
  //       const discount = new Prisma.Decimal(discount_rate || 0);
  //       const tax = new Prisma.Decimal(tax_rate || 0);

  //       const itemSubtotal = qty.mul(cost);
  //       const itemDiscount = itemSubtotal.mul(discount.div(100));
  //       const itemTax = itemSubtotal.sub(itemDiscount).mul(tax.div(100));
  //       const itemTotal = itemSubtotal.sub(itemDiscount).add(itemTax);

  //       subtotal = subtotal.add(itemSubtotal);
  //       totalDiscount = totalDiscount.add(itemDiscount);
  //       totalTax = totalTax.add(itemTax);

  //       purchaseOrderItems.push({
  //         product_id,
  //         quantity: qty,
  //         unit_cost: cost,
  //         discount_rate: discount,
  //         tax_rate: tax,
  //         subtotal: itemSubtotal,
  //         discount_amount: itemDiscount,
  //         tax_amount: itemTax,
  //         total: itemTotal,
  //         notes: notes,
  //       });
  //     }
  //     const total = subtotal.sub(totalDiscount).add(totalTax);
  //     const purchaseOrder = await tx.purchaseOrder.create({
  //       data: {
  //         store_id: storeId,
  //         order_number:
  //           dto.order_number ||
  //           (await this.generateCode.generateOrderNumber(storeId)),
  //         order_date: dto.order_date || new Date(),
  //         supplier_code: supplier.code,
  //         expected_date: dto.expected_date,
  //         notes: dto.notes,
  //         created_by: user.id,
  //         status: purchase_order_status.ORDERED,
  //         supplier_id: supplier.id,
  //         discount_amount: totalDiscount,
  //         tax_amount: totalTax,
  //         subtotal,
  //         total,
  //       },
  //       include: {
  //         items: true,
  //       },
  //     });
  //     const createdItems = await Promise.all(
  //       purchaseOrderItems.map((item) =>
  //         tx.purchaseOrderItem.create({
  //           data: {
  //             purchase_order_id: purchaseOrder.id,
  //             product_id: item.product_id,
  //             variant_id: item.variant_id,
  //             ...item,
  //           },
  //         }),
  //       ),
  //     );
  //     await Promise.all(
  //       purchaseOrderItems.map((item) =>
  //         tx.product.update({
  //           where: {
  //             id: item.product_id,
  //           },
  //           data: {
  //             source_type: product_type.PURCHASE,
  //           },
  //         }),
  //       ),
  //     );

  //     return {
  //       purchase_order_id: purchaseOrder.id,
  //       order_number: purchaseOrder.order_number,
  //       supplier_id: purchaseOrder.supplier_id,
  //       store_id: storeId,
  //       status: purchaseOrder.status,
  //       subtotal: purchaseOrder.subtotal,
  //       discount_amount: purchaseOrder.discount_amount,
  //       tax_amount: purchaseOrder.tax_amount,
  //       total: purchaseOrder.total,
  //       items_count: createdItems.length,
  //       created_at: purchaseOrder.createdAt,
  //       items: createdItems.map((item) => ({
  //         id: item.id,
  //         product_id: item.product_id,
  //         quantity: item.quantity,
  //         unit_cost: item.unit_cost,
  //         total: item.total,
  //         notes: item.notes,
  //         discount_rate: item.discount_rate,
  //         tax_rate: item.tax_rate,
  //         discount_amount: item.discount_amount,
  //         tax_amount: item.tax_amount,
  //       })),
  //     };
  //   });
  // }

  async acceptPurchaseImport(id: string, storeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.findUnique({
        where: { id, store_id: storeId },
      });
      if (!purchaseOrder)
        throw new NotFoundError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);
      await tx.purchaseOrder.update({
        where: {
          id: id,
          store_id: storeId,
        },
        data: {
          status: purchase_order_status.RECEIVED,
        },
      });
      // update inventory per items in purchase order
      const items = await tx.purchaseOrderItem.findMany({
        where: {
          purchase_order_id: id,
        },
      });
      await Promise.all(
        items.map(async (item) => {
          await this.stock_movement.create(
            item.product_id,
            stock_movement_type.PURCHASE,
            Number(item.quantity),
            tx,
          );
        }),
      );

      return {
        purchase_order_id: id,
        order_number: purchaseOrder.order_number,
        status: purchaseOrder.status,
        created_at: purchaseOrder.createdAt,
      };
    });
  }
  async getPurchaseOrders(
    storeId: string,
    query: Prisma.PurchaseOrderFindManyArgs,
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      AND: [
        query.where ?? {},
        {
          store_id: storeId,
        },
      ],
    };

    const [purchaseOrders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          supplier: {
            select: {
              name: true,
              code: true,
            },
          },
          items: {
            select: {
              product_id: true,
              quantity: true,
              unit_cost: true,
              total: true,
              notes: true,
              discount_rate: true,
              tax_rate: true,
              discount_amount: true,
              tax_amount: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.purchaseOrder.count({
        where,
      }),
    ]);
    return {
      data: purchaseOrders,
      total,
    };
  }
}
