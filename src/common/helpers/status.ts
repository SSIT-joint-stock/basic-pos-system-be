import { Injectable } from '@nestjs/common';
import {
  order_status,
  payment_method,
  payment_status,
  product_status,
  purchase_order_status,
  StoreMemberRole,
  transaction_status,
} from '@prisma/client';

@Injectable()
export class FormatStatus {
  orderStatus(status: order_status): string {
    const map: Record<order_status, string> = {
      OVERAGE: 'Trả thừa',
      RETURNED: 'Đã trả hàng',
      PENDING: 'Chờ thanh toán',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
      PROCESSING: 'Đang xử lý',
    };
    return map[status];
  }

  // ===== PURCHASE ORDER (NHẬP HÀNG) =====
  purchaseOrderStatus(status: purchase_order_status): string {
    const map: Record<purchase_order_status, string> = {
      PENDING: 'Chờ duyệt',
      RECEIVED: 'Đã nhận hàng',
    };
    return map[status];
  }

  // ===== PAYMENT STATUS =====
  paymentStatus(status: payment_status): string {
    const map: Record<payment_status, string> = {
      UNPAID: 'Chưa thanh toán',
      PARTIAL: 'Thanh toán một phần',
      PAID: 'Đã thanh toán',
      OVERDUE: 'Quá hạn',
    };
    return map[status];
  }

  // ===== PAYMENT METHOD =====
  paymentMethod(method: payment_method): string {
    const map: Record<payment_method, string> = {
      CASH: 'Tiền mặt',
      CREDIT_CARD: 'Thẻ tín dụng',
      DEBIT_CARD: 'Thẻ ghi nợ',
      BANK_TRANSFER: 'Chuyển khoản',
      DIGITAL_WALLET: 'Ví điện tử',
    };
    return map[method];
  }

  // ===== STORE MEMBER ROLE =====
  storeMemberRole(role: StoreMemberRole): string {
    const map: Record<StoreMemberRole, string> = {
      OWNER: 'Chủ cửa hàng',
      MEMBER: 'Nhân viên',
    };
    return map[role];
  }

  // ===== PRODUCT STATUS =====
  productStatus(status: product_status): string {
    const map: Record<product_status, string> = {
      ACTIVE: 'Hoạt động',
      INACTIVE: 'Không hoạt động',
      SOLD: 'Hết hàng',
    };
    return map[status];
  }

  // ===== TRANSACTION STATUS =====
  transactionStatus(status: transaction_status): string {
    const labels = {
      PENDING: 'Chờ duyệt',
      CONFIRMED: 'Đã duyệt',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  }
}
