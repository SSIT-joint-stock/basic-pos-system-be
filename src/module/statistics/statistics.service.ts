import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import dayjs from 'dayjs';
@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getRevenue(storeId: string, type: 'day' | 'week' | 'month') {
    const now = dayjs();
    let startDate = now.startOf('day').subtract(6, 'day');

    if (type === 'week') {
      // 7 tuần gần nhất (tính từ tuần hiện tại)
      startDate = now.startOf('week').subtract(6, 'week');
    } else if (type === 'month') {
      // 12 tháng gần nhất
      startDate = now.startOf('month').subtract(11, 'month');
    }

    const orders = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: startDate.toDate(),
        },
      },
      select: {
        createdAt: true,
        total_amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueMap: Record<string, number> = {};
    for (const order of orders) {
      let key: string;
      if (type === 'day') {
        key = dayjs(order.createdAt).format('YYYY-MM-DD');
      } else if (type === 'week') {
        // dùng ngày bắt đầu của tuần làm key (ví dụ: "2025-09-22")
        key = dayjs(order.createdAt).startOf('week').format('YYYY-MM-DD');
      } else {
        // month
        key = dayjs(order.createdAt).format('YYYY-MM');
      }

      revenueMap[key] = (revenueMap[key] || 0) + Number(order.total_amount);
    }

    // build array đảm bảo đủ các bucket (7/7/12) và thứ tự tăng dần theo thời gian
    const data: { key: string; value: number }[] = [];

    if (type === 'day') {
      for (let i = 0; i < 7; i++) {
        const key = dayjs()
          .startOf('day')
          .subtract(6 - i, 'day')
          .format('YYYY-MM-DD');
        data.push({ key, value: revenueMap[key] || 0 });
      }
    } else if (type === 'week') {
      for (let i = 0; i < 7; i++) {
        // tuần bắt đầu
        const key = dayjs()
          .startOf('week')
          .subtract(6 - i, 'week')
          .startOf('week')
          .format('YYYY-MM-DD');
        data.push({ key, value: revenueMap[key] || 0 });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const key = dayjs()
          .startOf('month')
          .subtract(11 - i, 'month')
          .format('YYYY-MM');
        data.push({ key, value: revenueMap[key] || 0 });
      }
    }

    return { type, data };
  }
  async getNotifications(storeId: string) {
    const lowStock = await this.prismaService.inventory.findMany({
      where: {
        product: {
          store_id: storeId,
        },
        quantity: { lte: 0 },
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });
    const getStatusInStock = await this.prismaService.stockMovement.findMany({
      where: {
        product: {
          store_id: storeId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });
    const orders = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        order_item: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    const notifications = [
      ...lowStock.map((item) => ({
        title: `Sản phẩm ${item.product.name} đã hết hàng`,
        time: item.updatedAt,
      })),
      ...orders.map((order) => ({
        title: `Đơn hàng ${order.code ?? order.id} vừa tạo (${order.total_amount}₫)`,
        time: order.createdAt,
      })),
      ...getStatusInStock.map((item) => ({
        title: `Số lượng ${item.quantity} sản phẩm ${item.product.name} đã được ${item.type}`,
        time: item.createdAt,
      })),
    ].sort((a, b) => +new Date(b.time) - +new Date(a.time));
    return {
      notifications,
    };
  }
}
