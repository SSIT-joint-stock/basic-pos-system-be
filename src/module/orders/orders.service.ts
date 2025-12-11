import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { PrismaService } from 'app/prisma/prisma.service';
import { order_status, Prisma, stock_movement_type } from '@prisma/client';
import { StockMovementService } from 'app/module/stock-movement/stock-movement.service';
import { IUser } from 'app/common/types/user.type';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { CreateOrderItemDto } from './dto/create-order-item';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockMovement: StockMovementService,
    private generateOrderCode: GenerateOrderCodeUseCase,
    private applyStock: ApplyStockUseCase,
  ) {}

  async create(storeId: string, dto: CreateOrderDto, user: IUser) {
    const {
      code,
      customer_name,
      customer_pay_amount = 0,
      payment_method,
      order_items = [],
    } = dto;

    const { subtotal_amount, discount_amount, tax_amount } =
      this.calculateOrderTotals(order_items);
    const total_amount = subtotal_amount - discount_amount + tax_amount;
    const orderStatus = this.determineOrderStatus(
      total_amount,
      customer_pay_amount,
    );

    const changeAmount = customer_pay_amount - total_amount;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          store_id: storeId,
          code:
            code || (await this.generateOrderCode.generateOrderCode(storeId)),
          cashier_id: user.id,
          customer_name,
          subtotal_amount,
          discount_amount,
          customer_pay_amount,
          change_amount: changeAmount,
          tax_amount,
          total_amount,
          payment_method,

          status: orderStatus,
          order_item: {
            createMany: {
              data: order_items.map((item) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price,
                meta: item.meta ?? {},
                discount_rate: item.discount_rate,
                tax_rate: item.tax_rate,
              })),
            },
          },
        },
      });

      for (const item of order_items) {
        await this.handleStockChange(storeId, item);
      }

      return { order, orderId: order.id };
    });
  }

  async delete(orderId: string, storeId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, store_id: storeId },
        include: { order_item: {} },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      for (const item of order.order_item) {
        await this.applyStock.execute(
          stock_movement_type.ADJUSTMENT,
          storeId,
          item.variant_id,
          item.product_id,
          item.quantity,
        );

        await tx.orderItem.deleteMany({
          where: { order_id: orderId },
        });
      }
      await tx.order.delete({
        where: { id: orderId },
      });
      return order;
    });
  }

  async findById(orderId: string, storeId: string) {
    return await this.prisma.order.findUnique({
      where: { id: orderId, store_id: storeId },
      include: {
        order_item: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  async findAll(store_id: string, query?: Prisma.OrderFindManyArgs) {
    // ensure store filter is always applied
    const baseWhere: Prisma.OrderWhereInput = {
      AND: [query?.where ?? {}, { store_id }],
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: baseWhere,
        skip: query?.skip,
        take: query?.take,
        orderBy: query?.orderBy,
        include: {
          customer: true,
          order_item: {
            select: {
              variant_id: true,
              product_id: true,
              price: true,
              tax_rate: true,
              discount_rate: true,
              quantity: true,
              meta: true,

              variant: {
                select: {
                  id: true,
                  price: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where: baseWhere }),
    ]);

    return {
      data: orders,
      total,
    };
  }

  /**
   * Xác định trạng thái đơn hàng dựa trên tổng tiền và số tiền khách trả.
   */
  private determineOrderStatus(total: number, paid: number): order_status {
    if (total === paid) return order_status.COMPLETED;
    if (total > paid) return order_status.PENDING;
    return order_status.OVERAGE;
  }
  /**
   * Cập nhật tồn kho và lịch sử tồn kho cho từng sản phẩm.
   *
   */
  private async handleStockChange(
    storeId: string,
    item: { product_id: string; quantity: number; variant_id: string },
  ) {
    const qty = -Math.abs(item.quantity);

    await this.applyStock.execute(
      stock_movement_type.SALE,
      storeId,
      item.variant_id,
      item.product_id,
      qty,
    );
  }
  private calculateOrderTotals(order_items: CreateOrderItemDto[]) {
    const calculatedItems = order_items.map((item) => {
      const itemSubtotal = item.quantity * item.price;
      const itemDiscount = itemSubtotal * (item.discount_rate || 0);
      const subtotalAfterDiscount = itemSubtotal - itemDiscount;
      const itemTax = subtotalAfterDiscount * ((item.tax_rate || 0) / 100);

      return {
        subtotal: itemSubtotal,
        discount_amount: Math.round(itemDiscount),
        tax_amount: Math.round(itemTax),
        line_total: Math.round(subtotalAfterDiscount + itemTax),
      };
    });

    return {
      subtotal_amount: calculatedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      ),
      discount_amount: calculatedItems.reduce(
        (sum, item) => sum + item.discount_amount,
        0,
      ),
      tax_amount: calculatedItems.reduce(
        (sum, item) => sum + item.tax_amount,
        0,
      ),
      line_items: calculatedItems,
    };
  }
}
