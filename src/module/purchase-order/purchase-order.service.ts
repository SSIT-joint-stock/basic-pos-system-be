import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { BadRequestError, NotFoundError } from 'app/common/response';
import {
  payment_status,
  Prisma,
  purchase_order_status,
  stock_movement_type,
} from '@prisma/client';
import { GeneratePurchaseCodeUseCase } from './use-case/genereate-order-number.usecase';
import { CreatePurchaseOrderDto } from './dto/purchase-order.dto';
import { IUser } from 'app/common/types/user.type';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';

type PurchaseOrderItemInput = Omit<
  Prisma.PurchaseOrderItemUncheckedCreateInput,
  'id' | 'purchase_order_id'
>;

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateCode: GeneratePurchaseCodeUseCase,
    private readonly applyStock: ApplyStockUseCase,
  ) {}
  private readonly errMsg = {
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại trong kho',
    UNIT_NOT_FOUND: 'Đơn vị quy đổi không tìm thấy trong sản phẩm',
    INVALID_ITEM_DATA: 'Không có sản phẩm trong đơn nhập. Vui lòng thử lại',
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng',
    SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp',
    PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy đơn nhập hàng',
    PURCHASE_ORDER_NOT_ACCEPTED: 'Đơn hàng hiện có trạng thái không hợp lệ',
    PURCHASE_ORDER_ALREADY_ACCEPTED: 'Đơn hàng đã được nhập trên cửa hàng nay',
  };

  async createPurchaseOrder(
    storeId: string,
    dto: CreatePurchaseOrderDto,
    user: IUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { items } = dto;
      if (!items.length) {
        throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
      }
      await this.checkStore(storeId);
      const supplier = await this.checkSupplier(dto.supplier_id);
      const variantIds = dto.items
        .filter((item) => item.variant_id !== undefined)
        .map((item) => item.variant_id);
      const variants = await tx.variant.findMany({
        where: {
          id: {
            in: variantIds,
          },
        },
        include: {
          product: true,
          conversions: true,
        },
      });
      const variantMap = new Map(
        variants.map((variant) => [variant.id, variant]),
      );
      const purchaseOrderItems: PurchaseOrderItemInput[] = [];
      let subtotal = new Prisma.Decimal(0);
      let totalDiscount = new Prisma.Decimal(0);
      let totalTax = new Prisma.Decimal(0);
      for (const item of items) {
        const {
          variant_id,
          product_id,
          quantity,
          tax_rate,
          discount_rate,
          notes,
          unit_cost,
          unit,
        } = item;

        if (!variantMap.has(variant_id)) {
          throw new NotFoundError(this.errMsg.PRODUCT_NOT_FOUND);
        }

        const variant = variantMap.get(variant_id);
        const product = variant?.product;
        let appliedFactor = 1;
        if (unit && unit !== product?.baseUnit) {
          const conversion = variant?.conversions?.find(
            (c) => c.name.toLowerCase() === unit.toLowerCase(),
          );
          if (!conversion) {
            throw new NotFoundError(`${this.errMsg.UNIT_NOT_FOUND}: ${unit}`);
          }
          appliedFactor = conversion.factor;
        }
        const inputQty = new Prisma.Decimal(quantity);
        const appliedFactorDecimal = new Prisma.Decimal(appliedFactor);
        const baseQty = inputQty.mul(appliedFactorDecimal);

        const cost = new Prisma.Decimal(unit_cost);
        const discount = new Prisma.Decimal(discount_rate || 0);
        const tax = new Prisma.Decimal(tax_rate || 0);

        // cacu total
        const itemSubtotal = baseQty.mul(cost);
        const itemDiscount = itemSubtotal.mul(discount.div(100));
        const itemTax = itemSubtotal.sub(itemDiscount).mul(tax.div(100));
        const itemTotal = itemSubtotal.sub(itemDiscount).add(itemTax);

        // cacu total base quty
        subtotal = subtotal.add(itemSubtotal);
        totalDiscount = totalDiscount.add(itemDiscount);
        totalTax = totalTax.add(itemTax);

        purchaseOrderItems.push({
          product_id,
          variant_id,
          item_name: variant?.name,
          quantity: inputQty,
          unit_cost: cost,
          unit: unit ?? product?.baseUnit,
          applied_factor: appliedFactor,
          total_base_qty: Number(baseQty),
          discount_rate: discount,
          tax_rate: tax,
          subtotal: itemSubtotal,
          discount_amount: itemDiscount,
          tax_amount: itemTax,
          total: itemTotal,
          notes: notes ? notes : null,
        });
      }
      const total = subtotal.sub(totalDiscount).add(totalTax);
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          store_id: storeId,
          order_number:
            dto.order_number ||
            (await this.generateCode.generateOrderNumber(storeId)),
          order_date: dto.order_date || new Date(),
          supplier_code: supplier.code,
          expected_date: dto.expected_date,
          notes: dto.notes,
          created_by: user.id,
          status: purchase_order_status.PENDING,
          supplier_id: supplier.id,
          discount_amount: totalDiscount,
          tax_amount: totalTax,
          subtotal,
          total,
        },
        include: {
          items: true,
        },
      });
      const createdItems = await Promise.all(
        purchaseOrderItems.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              ...item,
              purchase_order_id: purchaseOrder.id,
            },
          }),
        ),
      );

      return {
        id: purchaseOrder.id,
        order_number: purchaseOrder.order_number,
        supplier_id: purchaseOrder.supplier_id,
        store_id: storeId,
        status: purchaseOrder.status,
        subtotal: purchaseOrder.subtotal,
        discount_amount: purchaseOrder.discount_amount,
        tax_amount: purchaseOrder.tax_amount,
        total: purchaseOrder.total,
        items_count: createdItems.length,
        created_at: purchaseOrder.createdAt,
        items: createdItems.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          unit: item.unit,
          applied_factor: item.applied_factor,
          total_base_qty: item.total_base_qty,
          subtotal: item.subtotal,
          total: item.total,
          notes: item.notes,
          discount_rate: item.discount_rate,
          tax_rate: item.tax_rate,
          discount_amount: item.discount_amount,
          tax_amount: item.tax_amount,
        })),
      };
    });
  }

  async acceptPurchaseImport(id: string, storeId: string, user: IUser) {
    await this.checkStore(storeId);

    const purchaseOrder = await this.checkPurchaseOrder(id, storeId);

    if (purchaseOrder.status === purchase_order_status.RECEIVED) {
      throw new BadRequestError(this.errMsg.PURCHASE_ORDER_ALREADY_ACCEPTED);
    }

    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { purchase_order_id: id },
    });

    if (purchaseOrder.status !== purchase_order_status.PENDING) {
      throw new BadRequestError(this.errMsg.PURCHASE_ORDER_NOT_ACCEPTED);
    }

    for (const item of items) {
      await this.applyStock.execute(
        stock_movement_type.PURCHASE,
        storeId,
        item.variant_id,
        item.product_id,
        Number(item.total_base_qty) || 0,
      );
    }

    const updatedPurchaseOrder = await this.prisma.purchaseOrder.update({
      where: { id: id },
      data: {
        status: purchase_order_status.RECEIVED,
        received_date: new Date(),
        approved_at: new Date(),
        approved_by: user.id,
      },
    });

    return {
      purchase_order_id: id,
      order_number: updatedPurchaseOrder.order_number,
      status: updatedPurchaseOrder.status,
      created_at: updatedPurchaseOrder.createdAt,
    };
  }

  async getPurchaseOrders(
    storeId: string,
    query: Prisma.PurchaseOrderFindManyArgs,
  ) {
    await this.checkStore(storeId);
    const where: Prisma.PurchaseOrderWhereInput = {
      AND: [
        query.where ?? {},
        {
          store_id: storeId,
        },
      ],
    };

    const [purchaseOrders, total, summary] = await Promise.all([
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
      this.prisma.purchaseOrder.aggregate({
        where: {
          payment_status: payment_status.PAID,
        },
        _sum: {
          total: true,
        },
      }),
    ]);
    return {
      data: purchaseOrders,
      total,
      summary: {
        totalPurchaseAmount: summary._sum.total ?? 0,
      },
    };
  }
  async getPurchaseOrder(id: string, storeId: string) {
    await Promise.all([
      this.checkStore(storeId),
      this.checkPurchaseOrder(id, storeId),
    ]);
    return await this.prisma.purchaseOrder.findUnique({
      where: {
        id,
        store_id: storeId,
      },
      include: {
        supplier: {
          select: {
            name: true,
            tax_code: true,
          },
        },
        items: true,
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        payments: true,
      },
    });
  }

  // helpers func
  private async checkStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    return store;
  }
  private async checkPurchaseOrder(id: string, storeId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: {
        id,
        store_id: storeId,
      },
    });
    if (!purchaseOrder)
      throw new NotFoundError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);
    return purchaseOrder;
  }
  private async checkSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });
    if (!supplier) throw new NotFoundError(this.errMsg.SUPPLIER_NOT_FOUND);
    return supplier;
  }
}
