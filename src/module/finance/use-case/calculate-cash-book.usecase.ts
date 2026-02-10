import { Injectable } from '@nestjs/common';
import {
  CashBookEntry,
  Prisma,
  transaction_status,
  transaction_type,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'app/prisma/prisma.service';

/**
 * UseCase: Tính toán sổ quỹ cho một ngày
 * - Lấy số dư đầu ngày (từ ngày hôm trước)
 * - Tính tổng thu trong ngày
 * - Tính tổng chi trong ngày
 * - Tính số dư cuối ngày
 */
@Injectable()
export class CalculateCashBookUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán sổ quỹ cho một ngày cụ thể
   * @param storeId - ID cửa hàng
   * @param date - Ngày cần tính toán
   * @returns CashBookEntry đã được tạo/cập nhật
   */
  async calculateForDate(
    storeId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<CashBookEntry> {
    const prisma = tx || this.prisma;
    // Chuẩn hóa date về đầu ngày (00:00:00)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Lấy số dư đầu ngày (closing balance của ngày hôm trước)
    const previousDay = new Date(startOfDay);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousEntry = await prisma.cashBookEntry.findUnique({
      where: {
        store_id_date: {
          store_id: storeId,
          date: previousDay,
        },
      },
    });

    const openingBalance = previousEntry
      ? previousEntry.closing_balance
      : new Decimal(0);

    // 2. Tính tổng thu trong ngày (chỉ CONFIRMED)
    const receiptsResult = await prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: transaction_type.RECEIPT,
        status: transaction_status.CONFIRMED,
        transaction_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalReceipts = receiptsResult._sum.amount || new Decimal(0);

    // 3. Tính tổng chi trong ngày (chỉ CONFIRMED)
    const paymentsResult = await prisma.cashTransaction.aggregate({
      where: {
        store_id: storeId,
        transaction_type: transaction_type.PAYMENT,
        status: transaction_status.CONFIRMED,
        transaction_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalPayments = paymentsResult._sum.amount || new Decimal(0);

    // 4. Tính số dư cuối ngày
    const closingBalance = new Decimal(openingBalance)
      .plus(totalReceipts)
      .minus(totalPayments);

    // 5. Upsert CashBookEntry
    const cashBookEntry = await prisma.cashBookEntry.upsert({
      where: {
        store_id_date: {
          store_id: storeId,
          date: startOfDay,
        },
      },
      create: {
        store_id: storeId,
        date: startOfDay,
        opening_balance: openingBalance,
        total_receipts: totalReceipts,
        total_payments: totalPayments,
        closing_balance: closingBalance,
      },
      update: {
        opening_balance: openingBalance,
        total_receipts: totalReceipts,
        total_payments: totalPayments,
        closing_balance: closingBalance,
      },
    });

    return cashBookEntry;
  }

  /**
   * Lấy số dư hiện tại của cửa hàng
   * @param storeId - ID cửa hàng
   * @returns Số dư hiện tại
   */
  async getCurrentBalance(
    storeId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Decimal> {
    const prisma = tx || this.prisma;
    // Lấy entry gần nhất
    const latestEntry = await prisma.cashBookEntry.findFirst({
      where: {
        store_id: storeId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (latestEntry) {
      return latestEntry.closing_balance;
    }

    // Nếu chưa có entry nào, tính từ tất cả transactions
    const [receiptsSum, paymentsSum] = await Promise.all([
      prisma.cashTransaction.aggregate({
        where: {
          store_id: storeId,
          transaction_type: transaction_type.RECEIPT,
          status: transaction_status.CONFIRMED,
        },
        _sum: { amount: true },
      }),
      prisma.cashTransaction.aggregate({
        where: {
          store_id: storeId,
          transaction_type: transaction_type.PAYMENT,
          status: transaction_status.CONFIRMED,
        },
        _sum: { amount: true },
      }),
    ]);

    const receipts = receiptsSum._sum.amount || new Decimal(0);
    const payments = paymentsSum._sum.amount || new Decimal(0);

    return new Decimal(receipts).minus(payments);
  }
}
