import { Injectable } from '@nestjs/common';

@Injectable()
export class Format {
  formatCurrency<T>(currency: T) {
    return Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(currency));
  }
  formatDate(
    dateString: string | number | Date,
    options?: { showTime?: boolean },
  ) {
    const { showTime = false } = options || {};
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(showTime && { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  }
}
