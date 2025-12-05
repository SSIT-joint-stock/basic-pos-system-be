/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { PrismaService } from 'app/prisma/prisma.service';
import { order_status, Prisma, stock_movement_type } from '@prisma/client';
import { StockMovementService } from 'app/module/stock-movement/stock-movement.service';
import { IUser } from 'app/common/types/user.type';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockMovement: StockMovementService,
    private generateOrderCode: GenerateOrderCodeUseCase,
  ) {}

  //   TODO: Update quantity in inventory when Hoa complete his job

  async create(storeId: string, dto: CreateOrderDto, user: IUser) {
    const {
      code,
      customer_name,
      subtotal_amount,
      discount_amount,
      customer_pay_amount = 0,
      tax_amount,
      total_amount = 0,
      payment_method,
      order_items = [],
    } = dto;

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
          // order_item: {
          //   createMany: {
          //     data: order_items.map((item) => ({
          //       product_id: item.product_id,
          //       quantity: item.quantity,
          //       price: item.price,
          //       meta: item.meta ?? {},
          //     })),
          //   },
          // },
        },
      });

      for (const item of order_items) {
        await this.handleStockChange(storeId, item, tx);
        await this.handleStockChange(storeId, item, tx);
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
        await this.stockMovement.create(
          item.product_id,
          stock_movement_type.RETURN_SALE,
          item.quantity,
          tx,
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
            product: true,
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

    // build args for findMany: keep everything from query but use baseWhere
    const findArgs: Prisma.OrderFindManyArgs = {
      ...(query ?? {}),
      where: baseWhere,
    };

    // If user passed `select`, Prisma forbids `include` at same time.
    // So ensure include is only set when select isn't present.
    if (query?.select) {
      delete (findArgs as any).include;
    } else {
      (findArgs as any).include = {
        order_item: {
          include: {
            product: true,
          },
        },
        ...(query?.include ?? {}),
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany(findArgs),
      // count must use the same baseWhere (so it counts with store_id filter)
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
    item: { product_id: string; quantity: number },
    tx: Prisma.TransactionClient,
  ) {
    const qty = -Math.abs(item.quantity);

    await this.stockMovement.create(
      item.product_id,
      stock_movement_type.SALE,
      qty,
      tx,
    );
  }
}
