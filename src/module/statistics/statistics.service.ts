import { Injectable } from '@nestjs/common';
import { order_status } from '@prisma/client';
import { PrismaService } from 'app/prisma/prisma.service';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { NotificationType } from './../../common/types/notification.type';
@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getNotifications(
    storeId: string,
    type: 'all' | 'order' | 'stock',
    limit: number,
  ) {
    dayjs.extend(relativeTime);
    dayjs.locale('vi');

    const getStatusInStock = await this.prismaService.stockMovement.findMany({
      where: {
        variants: {
          product: {
            store_id: storeId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        variants: {
          select: {
            name: true,
            price: true,
            product: {
              select: {
                name: true,
              },
            },
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
      ...orders.map((order) => ({
        type: NotificationType.order,
        data: {
          code: order.code ?? order.id,
          amount: order.total_amount,
          payment_method: order.payment_method,
        },
        createdAt: order.createdAt,
      })),
      ...getStatusInStock.map((item) => ({
        type: NotificationType.stock,
        data: {
          quantity: item.quantity,
          variantName: item.variants.name,
          stockType: item.type,
        },
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return type === 'all'
      ? notifications
      : notifications.filter((item) => item.type === type);
  }
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

  async getRevenueByCategory(storeId: string, type: 'day' | 'week' | 'month') {
    let startDate: Date;
    const endDate: Date = new Date();
    if (type === 'day') {
      startDate = dayjs().startOf('day').toDate();
    } else if (type === 'week') {
      startDate = dayjs().startOf('week').toDate();
    } else {
      startDate = dayjs().startOf('month').toDate();
    }
    const orderByCategory = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total_amount: true,
        order_item: {
          select: {
            product: {
              select: {
                categories: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const categoryRevenue: Record<string, number> = {};
    let total = 0;
    orderByCategory.forEach((order) => {
      const itemCount = order.order_item.length || 1;
      const sharePerItem = Number(order.total_amount) / itemCount;
      order.order_item.forEach((item) => {
        if (item.product.categories.length > 0) {
          item.product.categories.forEach((cat) => {
            categoryRevenue[cat.name] =
              (categoryRevenue[cat.name] || 0) + sharePerItem;
          });
        } else {
          categoryRevenue['Khác'] =
            (categoryRevenue['Khác'] || 0) + sharePerItem;
        }
      });
      total += Number(order.total_amount);
    });
    return {
      total,
      categories: Object.entries(categoryRevenue).map(([name, value]) => ({
        name,
        value: Math.ceil(value),
      })),
    };
  }
  async summaryRevenue(storeId: string, type: 'day' | 'week' | 'month') {
    let startDate: Date;
    const endDate: Date = new Date();
    if (type === 'day') {
      startDate = dayjs().startOf('day').toDate();
    } else if (type === 'week') {
      startDate = dayjs().startOf('week').toDate();
    } else {
      startDate = dayjs().startOf('month').toDate();
    }

    const orders = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
        status: order_status.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order_item: true,
      },
    });
    const orderCount = orders.length;
    const totalRevenue = orders.reduce((acc, order) => {
      return acc + Number(order.total_amount ?? 0);
    }, 0);
    const customerCount = new Set(orders.map((order) => order.customer_id));
    const totalProduct = orders.reduce((acc, order) => {
      const totalQty = order.order_item.reduce((sum, i) => {
        return sum + i.quantity;
      }, 0);
      return acc + totalQty;
    }, 0);

    return {
      orderCount,
      totalRevenue,
      customerCount: customerCount.size,
      totalProduct,
    };
  }
  async getTopProducts(storeId: string) {
    const orders = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
        status: order_status.COMPLETED,
      },

      include: {
        order_item: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    const topProducts = orders
      .flatMap((order) => order.order_item)
      .reduce(
        (acc, item) => {
          acc[item.variant_id] = (acc[item.variant_id] || 0) + item.quantity;
          return acc;
        },
        {} as Record<string, number>,
      );
    const soldProducts = Object.keys(topProducts);
    const products = await this.prismaService.variant.findMany({
      where: {
        id: { in: soldProducts },
        product: {
          store_id: storeId,
        },
      },
      include: {
        product: true,
      },
    });
    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        baseProductName: product.product.name,
        baseUnit: product.product.baseUnit,
        imageUrl: product.product.image_url,
        quantitySold: topProducts[product.id] || 0,
      }))
      .filter((product) => product.quantitySold > 0)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 15);
  }
  async getLowStockProduct(storeId: string) {
    const now = dayjs();
    const formDate = now.subtract(30, 'day').toDate();
    const products = await this.prismaService.product.findMany({
      where: {
        store_id: storeId,
      },
      select: {
        id: true,
        name: true,
        // price: true,
        image_url: true,
      },
    });
    const orders = await this.prismaService.order.findMany({
      where: {
        store_id: storeId,
        status: order_status.COMPLETED,
        createdAt: {
          gte: formDate,
          lte: now.toDate(),
        },
      },
      include: {
        order_item: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    const salesMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.order_item) {
        const current = salesMap.get(item.product_id) || 0;
        salesMap.set(item.product_id, current + item.quantity);
      }
    }
    const result = products.map((product) => {
      const totalSold = salesMap.get(product.id) || 0;
      const avgDailySales = totalSold / 30;
      const daysRemaining = avgDailySales > 0 ? 30 / avgDailySales : Infinity;
      let status: 'critical' | 'warning' | 'normal' = 'normal';
      if (daysRemaining < 20) status = 'critical';
      else if (daysRemaining < 30) status = 'warning';
      return {
        product: {
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          // inventory: {},
          // price: product.price,
        },
        totalSold30Days: totalSold,
        daysRemaining: Number(daysRemaining.toFixed(1)),
        avgDailySales: Number(avgDailySales.toFixed(1)),
        status,
      };
    });
    return result
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .filter((p) => p.status !== 'normal');
  }
}
