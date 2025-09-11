import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { PrismaService } from 'app/prisma/prisma.service';
import { IUSER } from 'app/auth/token.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  //   TODO: Update quantity in inventory when Hoa complete his job
  create(cashier_id: string, dto: CreateOrderDto, user: IUSER) {
    return this.prisma.order.create({
      data: {
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
  }

  // TODO: DIT ME THANG HOA LAM NHANH LEN DE BO MAY CON LAM <3
  async remove(id: string) {
    try {
      await this.prisma.order.delete({ where: { id } });
      return { __raw: true, data: { deleted: true } };
    } catch {
      throw new NotFoundException('Order not found');
    }
  }

  async findAll(query: Prisma.OrderFindManyArgs) {
    // Prevent negative or zero values

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        ...query,
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
