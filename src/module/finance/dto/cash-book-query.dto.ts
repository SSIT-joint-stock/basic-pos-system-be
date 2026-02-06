import { IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO để query báo cáo sổ quỹ tiền mặt
 * Dùng cho API: GET /finance/cash-book
 */
export class CashBookQueryDto {
  @ApiProperty({
    description: 'ID cửa hàng',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID cửa hàng không được để trống' })
  @IsUUID('4', { message: 'ID cửa hàng không hợp lệ' })
  store_id: string;

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
