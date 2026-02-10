import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/**
 * DTO để query báo cáo sổ quỹ tiền mặt
 * Dùng cho API: GET /finance/cash-book
 */
export class CashBookQueryDto {
  @ApiProperty({
    description: 'Từ ngày (YYYY-MM-DD)',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Định dạng ngày không hợp lệ (YYYY-MM-DD)' })
  from_date?: string;

  @ApiProperty({
    description: 'Đến ngày (YYYY-MM-DD)',
    required: false,
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Định dạng ngày không hợp lệ (YYYY-MM-DD)' })
  to_date?: string;
}
