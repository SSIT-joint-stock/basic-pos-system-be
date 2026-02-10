import { Injectable } from '@nestjs/common';
import { payment_method, Prisma, purchase_order_status } from '@prisma/client';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { FinanceService } from 'app/module/finance/finance.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { AcceptPaymentImportPurchaseDto } from './dto/accept-payment-puchase.dto';

@Injectable()
export class PurchasePaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}
  private readonly errMsg = {
    PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy đơn nhập hàng',
    INVALID_PAYMENT_AMOUNT: 'Số tiền thanh toán không hợp lệ',
    INVALID_STATUS: 'Trạng thái đơn hàng không hợp lệ để thanh toán',
    PAYMENT_EXCEEDED: 'Số tiền thanh toán vượt quá tổng hóa đơn',
  };
  async acceptPayment(
    storeId: string,
    id: string,
    dto: AcceptPaymentImportPurchaseDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.findUnique({
        where: { id, store_id: storeId },
      });
      if (!purchaseOrder) {
        throw new NotFoundError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);
      }
      if (
        purchaseOrder.status !== purchase_order_status.PENDING &&
        purchaseOrder.status !== purchase_order_status.RECEIVED
      ) {
        throw new BadRequestError(this.errMsg.INVALID_STATUS);
      }
      if (Number(dto.unit_cost) <= 0) {
        throw new BadRequestError(this.errMsg.INVALID_PAYMENT_AMOUNT);
      }
      const previousPaid = purchaseOrder.paid_amount || new Prisma.Decimal(0);
      const newPaidAmount = previousPaid.add(dto.unit_cost);

      // Validate không vượt quá tổng
      if (newPaidAmount.greaterThan(purchaseOrder.total)) {
        throw new BadRequestError(this.errMsg.PAYMENT_EXCEEDED);
      }

      // Xác định payment_status mới
      let newPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';

      if (newPaidAmount.equals(purchaseOrder.total)) {
        newPaymentStatus = 'PAID'; // Đã thanh toán toàn bộ
      } else if (newPaidAmount.greaterThan(0)) {
        newPaymentStatus = 'PARTIAL'; // Thanh toán một phần
      } else {
        newPaymentStatus = 'UNPAID'; // Chưa thanh toán
      }
      const payment = await tx.purchasePayment.create({
        data: {
          purchase_order_id: id,
          unit_cost: dto.unit_cost,
          payment_method: dto.payment_method,
          payment_date: dto.payment_date || new Date(),
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      // Update purchase order
      await tx.purchaseOrder.update({
        where: { id: id },
        data: {
          paid_amount: newPaidAmount,
          payment_status: newPaymentStatus,
          payment_method: dto.payment_method,
        },
      });
      // update supplier total paid amount
      await tx.supplier.update({
        where: { id: purchaseOrder.supplier_id },
        data: {
          total_purchased: {
            increment: dto.unit_cost,
          },
        },
      });
      // create  payment cash-book
      await this.financeService.createPaymentFromPurchase(
        purchaseOrder.id,
        purchaseOrder.created_by,
        Number(purchaseOrder.total),
        purchaseOrder.payment_method || payment_method.CASH,
        tx,
      );
      return {
        purchase_order_id: id,
        order_number: purchaseOrder.order_number,
        total: purchaseOrder.total,
        previous_paid: previousPaid,
        payment_method: dto.payment_method,
        payment_amount: dto.unit_cost,
        new_paid_amount: newPaidAmount,
        remaining_amount: purchaseOrder.total.sub(newPaidAmount),
        payment_status: newPaymentStatus,
        payment_id: payment.id,
        created_at: payment.createdAt,
      };
    });
  }
  async getPaymentHistory(
    query: Prisma.PurchasePaymentFindManyArgs,
    storeId: string,
  ) {
    if (!storeId) {
      throw new BadRequestError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);
    }
    const where: Prisma.PurchasePaymentWhereInput = {
      AND: [
        query.where ?? {},
        {
          purchase_order: {
            // id: purchaseOrderId,
            store_id: storeId,
          },
        },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.purchasePayment.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          purchase_order: {
            select: {
              id: true,
              order_number: true,
              total: true,
              paid_amount: true,
              payment_status: true,
              payment_method: true,
              items: {
                select: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.purchasePayment.count({
        where,
      }),
    ]);
    return {
      data,
      total,
    };
  }
  async getPaymentSummary(storeId: string, purchaseOrderId: string) {
    return this.prisma.purchasePayment.findFirst({
      where: {
        purchase_order: {
          id: purchaseOrderId,
          store_id: storeId,
        },
      },
    });
  }
}
