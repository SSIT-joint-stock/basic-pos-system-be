import { Injectable } from '@nestjs/common';
import {
  payment_method,
  payment_status,
  Prisma,
  purchase_return_status,
  PurchaseReturn,
} from '@prisma/client';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { FinanceService } from 'app/module/finance/finance.service';
import { AcceptPaymentPurchaseReturnDto } from 'app/module/purchase-return/dto/accept-paymen-purchase-return.dto';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class PurchaseReturnPaymentService {
  private readonly errMsg = {
    PURCHASE_RETURN_NOT_FOUND:
      'Không tìm thấy hóa đơn nhập. Vui lòng thử lại sau ',
    PURCHASE_RETURN_NOT_COMPLETED:
      'Đơn nhập chưa hoàn thành. Vui lòng thử lập sau',
    PAYMENT_AMOUNT_NOT_VALID: 'Số tiền thanh toán không hợp lệ',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}
  async acceptPaymentPurchaseReturn(
    storeId: string,
    purchaseReturnId: string,
    dto: AcceptPaymentPurchaseReturnDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchaseReturn.findUnique({
        where: {
          store_id: storeId,
          id: purchaseReturnId,
        },
      });
      this.checkValidPurchaseReturn(purchaseReturn, dto);
      await tx.purchaseReturn.update({
        where: {
          id: purchaseReturnId,
          store_id: storeId,
        },
        data: {
          payment_status: payment_status.PAID,
        },
      });
      await tx.purchaseReturnPayment.create({
        data: {
          purchase_return_id: purchaseReturnId,
          notes: dto.notes,
          reference: dto.reference,
          amount: dto.amount,
          payment_date: dto.payment_date,
          payment_method: dto.payment_method || payment_method.CASH,
        },
      });
      await tx.supplier.update({
        where: { id: purchaseReturn?.supplier_id },
        data: {
          total_purchased: {
            decrement: dto.amount,
          },
        },
      });
      await this.financeService.createReceiptFromPurchaseReturn(
        purchaseReturnId,
        purchaseReturn?.created_by || '',
        Number(dto.amount),
        dto.payment_method,
      );
      return {
        ...purchaseReturn,
        payment_status: payment_status.PAID,
      };
    });
  }
  private checkValidPurchaseReturn(
    purchaseReturn: PurchaseReturn | null,
    dto: AcceptPaymentPurchaseReturnDto,
  ) {
    const inputAmount = new Prisma.Decimal(dto.amount);

    if (!purchaseReturn)
      throw new NotFoundError(this.errMsg.PURCHASE_RETURN_NOT_FOUND);
    if (purchaseReturn.status !== purchase_return_status.COMPLETED)
      throw new BadRequestError(this.errMsg.PURCHASE_RETURN_NOT_COMPLETED);
    if (!inputAmount.equals(purchaseReturn.total)) {
      throw new BadRequestError(
        `${this.errMsg.PAYMENT_AMOUNT_NOT_VALID}: ${purchaseReturn.total.toString()}`,
      );
    }
  }
}
