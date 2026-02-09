import { Injectable } from '@nestjs/common';
import { order_status, Prisma } from '@prisma/client';
import { NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class ReportStoreMemberService {
  constructor(private readonly prisma: PrismaService) {}
  async getReportStoreMembers(
    user: IUser,
    query: Prisma.StoreMemberFindFirstArgs,
  ) {
    if (!user.storeId) return { data: [], total: 0 };
    await Promise.all([
      this.checkIsOwner(user.id, user.storeId),
      this.checkStore(user.storeId),
    ]);
    const where: Prisma.StoreMemberWhereInput = {
      AND: [query.where ?? {}, { storeId: user.storeId }],
    };
    const [storeMember, total] = await Promise.all([
      this.prisma.storeMember.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          user: {
            include: {
              orders_cashier: true,
            },
          },
        },
      }),
      this.prisma.storeMember.count({
        where,
      }),
    ]);
    const reportStoreMember = storeMember.map((member) => {
      const orders = member.user.orders_cashier;
      const totalOrders = orders.length;
      const totalOrdersSuccess = orders.filter(
        (order) => order.status === order_status.COMPLETED,
      );
      const totalPriceAmount = orders.reduce((acc, item) => {
        return acc + item.customer_pay_amount;
      }, 0);
      return {
        member_id: member.userId,
        member_name: member.user.username,
        member_email: member.user.email,
        total_orders: totalOrders,
        total_order_success: totalOrdersSuccess.length,
        total_order_price: member.total_order,
        total_price_amount: totalPriceAmount,
        created_at: member.createdAt,
      };
    });
    return {
      data: reportStoreMember,
      total,
    };
  }
  async getReportStoreMemberDetails(user: IUser, memberId: string) {
    if (!user.storeId) return;
    await Promise.all([
      this.checkIsOwner(user.id, user.storeId),
      this.checkStore(user.storeId),
    ]);

    const member = await this.prisma.storeMember.findFirst({
      where: {
        userId: memberId,
      },
    });
    if (!member) throw new NotFoundError('Không tìm thấy thông tin nhân viên');
    const orderCreatedByMember = await this.prisma.storeMember.findFirst({
      where: {
        userId: member.userId,
      },
      include: {
        user: {
          select: {
            orders_cashier: true,
          },
        },
      },
    });
    return orderCreatedByMember;
  }
  private async checkStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new NotFoundError('Không tìm thấy cửa hàng');
    return store;
  }
  private async checkIsOwner(ownerId: string, storeId: string) {
    const hasAccess = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        owner_id: ownerId,
      },
    });

    return !!hasAccess;
  }
}
