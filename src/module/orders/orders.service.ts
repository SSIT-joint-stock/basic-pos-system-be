import { Injectable, NotFoundException } from '@nestjs/common';
import {
  order_status,
  payment_method as PaymentMethod,
  Prisma,
  stock_movement_type,
  StoreMemberRole,
} from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { FinanceService } from 'app/module/finance/finance.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { ApplyStockUseCase } from '../variant/use-case/apply-stock.usecase';
import { PricingService } from './../../shared/usecase/order-price.usecase';
import { CreateOrderDto } from './dto/create-order';
import { GenerateOrderCodeUseCase } from './use-case/generate-order-code.usecase';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private financeService: FinanceService,
    private generateOrderCode: GenerateOrderCodeUseCase,
    private applyStock: ApplyStockUseCase,
    private readonly pricingService: PricingService,
  ) {}

  async create(storeId: string, dto: CreateOrderDto, user: IUser) {
    const {
      code,
      customer_name,
      customer_pay_amount = 0,
      payment_method,
      order_items = [],
    } = dto;

    const pricing = this.pricingService.calcOrderTotals(
      order_items.map((i) => ({
        price: i.price,
        quantity: i.quantity,
        discountRate: i.discount_rate,
        taxRate: i.tax_rate,
      })),
    );

    const orderStatus = this.determineOrderStatus(
      pricing.total_amount,
      customer_pay_amount,
    );

    const changeAmount = customer_pay_amount - pricing.total_amount;

    return this.prisma.$transaction(async (tx) => {
      // Check if any product is deleted
      const productIds = [...new Set(order_items.map((i) => i.product_id))];
      const deletedProducts = await tx.product.count({
        where: {
          id: { in: productIds },
          is_deleted: true,
        },
      });

      if (deletedProducts > 0) {
        throw new NotFoundError('Một số sản phẩm trong đơn hàng đã bị xóa!');
      }

      const order = await tx.order.create({
        data: {
          store_id: storeId,
          code:
            code || (await this.generateOrderCode.generateOrderCode(storeId)),
          cashier_id: user.id,
          customer_name,
          subtotal_amount: pricing.subtotal_amount,
          discount_amount: pricing.discount_amount,
          customer_pay_amount,
          change_amount: changeAmount,
          tax_amount: pricing.tax_amount,
          total_amount: pricing.total_amount,
          payment_method,
          status: orderStatus,
          customer_id: dto.customer_id,
          order_item: {
            createMany: {
              data: order_items.map((item, index) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price,
                meta: item.meta ?? {},
                discount_rate: item.discount_rate,
                tax_rate: item.tax_rate,
                total: pricing.lineItems[index].total_amount,
              })),
            },
          },
        },
      });
      // update store member record total
      const member = await tx.storeMember.findUnique({
        where: {
          storeId_userId: {
            storeId,
            userId: user.id,
          },
        },
      });

      if (member && member.role !== StoreMemberRole.OWNER) {
        await tx.storeMember.update({
          where: {
            storeId_userId: {
              storeId,
              userId: user.id,
            },
          },
          data: {
            total_order: {
              increment: pricing.total_amount,
            },
          },
        });
      }

      // update record cash-book
      for (const item of order_items) {
        await this.handleStockChange(storeId, item, tx);
      }

      await this.financeService.createReceiptFromOrder(
        order.id,
        user.id,
        Math.min(customer_pay_amount, pricing.total_amount),
        payment_method || PaymentMethod.CASH,
        tx,
      );

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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, store_id: storeId },
      include: {
        customer: true,
        order_return: true,
        order_item: {
          include: {
            variant: true,
            product: true,
          },
        },
        cashier: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy hóa đơn!');
    }
    return order;
  }
  async findByCode(code: string, storeId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        code,
        store_id: storeId,
      },
      include: {
        order_item: {
          include: {
            variant: true,
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy hóa đơn!');
    }
    return order;
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
          cashier: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
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

  async getOrderByCustomer(
    customerId: string,
    storeId: string,
    query?: Prisma.OrderFindManyArgs,
  ) {
    const where: Prisma.OrderWhereInput = {
      AND: [query?.where ?? {}, { store_id: storeId, customer_id: customerId }],
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: query?.skip,
        take: query?.take,
        orderBy: query?.orderBy,
        include: {
          order_item: {
            include: {
              variant: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
    };
  }
  /**
   *
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
    tx: Prisma.TransactionClient,
  ) {
    const qty = -Math.abs(item.quantity);

    await this.applyStock.execute(
      stock_movement_type.SALE,
      storeId,
      item.variant_id,
      item.product_id,
      qty,
      tx,
    );
  }
}
