import { Injectable } from '@nestjs/common';
import {
  order_return_status,
  order_return_type,
  Prisma,
  stock_movement_type,
} from '@prisma/client';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { FinanceService } from 'app/module/finance/finance.service';
import { AcceptPaymentReturn } from 'app/module/order-return/dto/accept-payment-return.dto';
import { AcceptQuantityReturnDto } from 'app/module/order-return/dto/accept-quantity-return.dto';
import { OrderReturnDto } from 'app/module/order-return/dto/order-return.dto';
import { GenerateReturnOrderUseCase } from 'app/module/order-return/use-case/generate-return-num.usecase';
import { ApplyStockUseCase } from 'app/module/variant/use-case/apply-stock.usecase';
import { PrismaService } from 'app/prisma/prisma.service';
import { PricingService } from 'app/shared/usecase/order-price.usecase';

type OrderReturnItemInput = Omit<
  Prisma.OrderReturnItemUncheckedCreateInput,
  'id' | 'order_return_id'
>;

@Injectable()
export class OrderReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateReturnNumber: GenerateReturnOrderUseCase,
    private readonly financeService: FinanceService,
    private readonly pricingService: PricingService,
    private readonly applyStock: ApplyStockUseCase,
  ) {}

  private errMsg = {
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng!',
    INVALID_ITEM_DATA: 'Không có dữ liệu trong đơn hàng!',
    QUANTITY_NOT_VALID_IN_ITEM:
      'Vui lòng nhập số lượng cho ít nhất một sản phẩm',
    QUANTITY_NOT_VALID: 'Vui lòng nhập số lượng hợp lệ cho ',
  };
  async createOrderReturn(
    orderId: string,
    storeId: string,
    user: IUser,
    dto: OrderReturnDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.checkOrder(orderId, storeId, tx);
      const items = this.normalizeItems(this.checkHasItem(dto));

      if (!items.length) throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);

      const orderReturnItems: OrderReturnItemInput[] = [];
      for (const item of items) {
        const { quantity, reason_status, condition, order_item_id } = item;

        const orderItem = order.order_item.find(
          (item) => item.id === order_item_id,
        );
        if (!orderItem) throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
        const totalItemPrice = this.pricingService.calcReturnItemTotal(
          orderItem,
          quantity,
        );
        if (
          quantity > orderItem.quantity ||
          quantity > orderItem.quantity - Number(orderItem.quantity_return || 0)
        )
          throw new BadRequestError(
            this.errMsg.QUANTITY_NOT_VALID + orderItem.variant.name,
          );

        orderReturnItems.push({
          order_item_id,
          product_id: orderItem.product_id,
          variant_id: orderItem.variant_id,

          item_name: orderItem.variant.name,
          total: totalItemPrice,
          quantity: quantity,
          reason_status,
          condition,
        });

        await tx.orderItem.update({
          where: {
            id: order_item_id,
          },
          data: {
            quantity_return: {
              increment: quantity,
            },
          },
        });
      }
      const total = orderReturnItems.reduce(
        (acc, item) => acc + Number(item.total),
        0,
      );
      const suggestTotal = this.pricingService.calcSuggestRefund(
        total,
        order.customer_pay_amount,
      );

      const OrderReturn = await tx.orderReturn.create({
        data: {
          order_id: orderId,
          store_id: storeId,
          created_id: user.id,
          customer_id: order.customer_id,

          order_number: order.code || '',
          order_return_number:
            await this.generateReturnNumber.generateOrderReturn(storeId),

          customer_name: order.customer_name,
          customer_phone: order.customer?.phone,

          reason: dto.reason,
          items_length: orderReturnItems.length,
          total,
          suggest_total: suggestTotal,
          items: {
            createMany: {
              data: orderReturnItems,
            },
          },
        },
      });

      return OrderReturn;
    });
  }

  async acceptPaymentReturn(
    id: string,
    storeId: string,
    dto: AcceptPaymentReturn,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const orderReturn = await this.checkOrderReturn(id, storeId, tx);

      const hasPayment = await tx.orderReturnPayment.findFirst({
        where: {
          order_return_id: id,
        },
      });
      if (hasPayment)
        throw new BadRequestError(
          'Đơn hàng hoàn trả đã được thanh toán trước đó',
        );
      await this.checkOrderReturnHasCancelled(id, storeId, tx);

      if (dto.amount && dto.amount > Number(orderReturn.suggest_total)) {
        throw new BadRequestError(
          'Số tiền hoàn trả không được lớn hơn số tiền đề xuất',
        );
      }
      await tx.orderReturn.update({
        where: {
          id,
          store_id: storeId,
        },
        data: {
          return_status: order_return_status.REFUNDED,
        },
      });

      await tx.orderReturnPayment.create({
        data: {
          order_return_id: id,
          payment_method: dto.payment_method,
          amount: dto.amount || orderReturn.suggest_total,
          payment_date: dto.payment_date,
          reference: dto.reference,
          notes: dto.notes,
        },
      });
      await this.financeService.createPaymentFromOrderReturn(
        orderReturn.id,
        orderReturn.created_id,
        Number(dto.amount) || Number(orderReturn.suggest_total),
        dto.payment_method,
      );
    });
  }

  async acceptReturnQuantity(
    id: string,
    storeId: string,
    dto: AcceptQuantityReturnDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const items = this.normalizeItems(dto.items);
      if (!items.length)
        throw new BadRequestError(this.errMsg.QUANTITY_NOT_VALID_IN_ITEM);
      const orderReturn = await this.checkOrderReturn(id, storeId, tx);
      await this.checkOrderReturnHasCancelled(id, storeId, tx);

      for (const item of items) {
        const returnItem = orderReturn.items.find(
          (i) => i.id === item.order_return_item_id,
        );
        if (!returnItem)
          throw new NotFoundError('Không tìm thấy sản phẩm trả hàng');

        const remainQty = returnItem.quantity - returnItem.quantity_refunded;

        if (item.quantity <= 0 || item.quantity > remainQty)
          throw new BadRequestError('Số lượng trả về không hợp lệ');

        await tx.orderReturnItem.update({
          where: { id: item.order_return_item_id },
          data: {
            quantity_refunded: {
              increment: item.quantity,
            },
          },
        });

        await this.applyStock.execute(
          stock_movement_type.RETURN_SALE,
          storeId,
          returnItem.variant_id,
          returnItem.product_id,
          item.quantity,
          tx,
        );
      }

      const updatedReturn = await tx.orderReturn.findUnique({
        where: { id, store_id: storeId },
        include: { items: true },
      });

      const isFullReturn = updatedReturn?.items.every(
        (i) => i.quantity_refunded >= i.quantity,
      );

      await tx.orderReturn.update({
        where: { id, store_id: storeId },
        data: {
          return_type: isFullReturn
            ? order_return_type.FULL
            : order_return_type.PARTIAL,
        },
      });
    });
  }

  async getOrderReturn(id: string, storeId: string) {
    return this.prisma.orderReturn.findUnique({
      where: {
        id,
        store_id: storeId,
      },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
        payment: true,
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getOrderReturns(
    storeId: string,
    query: Prisma.OrderReturnFindManyArgs,
  ) {
    const where: Prisma.OrderReturnWhereInput = {
      AND: [query.where ?? {}, { store_id: storeId }],
    };
    const [orderReturns, total] = await Promise.all([
      this.prisma.orderReturn.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.orderReturn.count({
        where,
      }),
    ]);

    return { data: orderReturns, total };
  }

  async cancelOrderReturn(id: string, storeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const orderReturn = await this.checkOrderReturn(id, storeId, tx);
      if (
        orderReturn.return_status === order_return_status.REFUNDED ||
        orderReturn.return_type !== order_return_type.NONE
      )
        throw new BadRequestError(
          'Không thể hủy đơn do đơn hàng đã được thanh toán hoặc đã được hoàn trả hàng',
        );
      if (orderReturn.return_status === order_return_status.CANCELLED)
        throw new BadRequestError('Đơn hàng đã được hủy');
      for (const item of orderReturn.items) {
        await tx.orderItem.update({
          where: {
            id: item.order_item_id,
          },
          data: {
            quantity_return: {
              decrement: item.quantity,
            },
          },
        });
      }
      await tx.orderReturn.update({
        where: {
          id,
          store_id: storeId,
        },
        data: {
          return_status: order_return_status.CANCELLED,
        },
      });
    });
  }
  // =================== PRIVATE METHOD ===================
  private normalizeItems<T extends { quantity?: number }>(items: T[]): T[] {
    return items.filter((i) => i.quantity && i.quantity > 0);
  }
  private checkHasItem(dto: OrderReturnDto) {
    const { items } = dto;
    if (!items.length) throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
    return items;
  }
  private async checkOrder(
    orderId: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ) {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
        store_id: storeId,
      },
      include: {
        order_item: {
          include: {
            variant: true,
          },
        },
        customer: true,
      },
    });
    if (!order) throw new NotFoundError(this.errMsg.ORDER_NOT_FOUND);
    return order;
  }

  private async checkOrderReturn(
    id: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ) {
    const orderReturn = await tx.orderReturn.findUnique({
      where: {
        id: id,
        store_id: storeId,
      },
      include: {
        items: true,
      },
    });
    if (!orderReturn) throw new NotFoundError(this.errMsg.ORDER_NOT_FOUND);
    return orderReturn;
  }
  private async checkOrderReturnHasCancelled(
    id: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ) {
    const orderReturn = await this.checkOrderReturn(id, storeId, tx);
    if (orderReturn.return_status === order_return_status.CANCELLED)
      throw new BadRequestError('Đơn hàng đã bị hủy. Không thể thao tác');
  }
}
