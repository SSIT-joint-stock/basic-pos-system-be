import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatStatus {
  statusOrdersLabels: Record<string, string> = {
    OVERAGE: 'Trả thừa',
    RETURNED: 'Đã trả hàng',
    PENDING: 'Chờ thanh toán',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
    PAID: 'Đã thanh toán',
    REFUNDED: 'Đã hoàn tiền',
  };
}
