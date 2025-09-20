/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, stock_movement_type } from '@prisma/client';
import { InventoryService } from 'app/module/inventory/inventory.service';
import { StockMovementService } from 'app/module/stock-movement/stock-movement.service';
import { IUser } from 'app/common/types/user.type';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private stockMovement: StockMovementService,
  ) {}

  //   TODO: Update quantity in inventory when Hoa complete his job
  create(storeId: string, dto: CreateOrderDto, user: IUser) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          store_id: storeId,
          code: dto.code,
          cashier_id: user.id,
          customer_name: dto.customer_name,
          subtotal_amount: dto.subtotal_amount,
          discount_amount: dto.discount_amount,
          tax_amount: dto.tax_amount,
          total_amount: dto.total_amount,
          payment_method: dto.payment_method,
          status: dto.status,
          order_item: {
            createMany: {
              data: dto.order_items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                meta: item.meta || {},
              })),
            },
          },
        },
      });

      const order_items = dto.order_items;

      for (const item of order_items) {
        await this.stockMovement.create(
          item.product_id,
          stock_movement_type.SALE,
          item.quantity,
          tx,
        );

        await this.inventory.modify(
          stock_movement_type.SALE,
          storeId,
          item.product_id,
          item.quantity,
          tx,
        );
      }

      return order;
    });
  }

  async delete(orderId: string, storeId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, store_id: storeId },
        include: { order_item: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      for (const item of order.order_item) {
        await this.inventory.modify(
          stock_movement_type.RETURN_SALE,
          storeId,
          item.product_id,
          item.quantity,
          tx,
        );
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

  async findAll(store_id: string, query: Prisma.OrderFindManyArgs) {
    // Prevent negative or zero values
    const where: Prisma.OrderWhereInput = {
      AND: [query.where ?? {}, { store_id }],
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          order_item: true, // include order items if needed
        },
      }),
      this.prisma.order.count({
        where: query.where,
      }),
    ]);
    return {
      data: orders,
      total,
    };
  }
}
