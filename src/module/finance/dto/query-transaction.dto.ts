import { ApiProperty } from '@nestjs/swagger';
import {
  payment_method,
  transaction_source,
  transaction_status,
  transaction_type,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO để query/filter danh sách giao dịch
 * Dùng cho API: GET /finance/transactions
 */
export class QueryTransactionDto {
  @ApiProperty({
    description: 'Loại giao dịch',
    enum: transaction_type,
    required: false,
    example: 'RECEIPT',
  })
  @IsOptional()
  @IsEnum(transaction_type, { message: 'Loại giao dịch không hợp lệ' })
  transaction_type?: transaction_type;

  @ApiProperty({
    description: 'Nguồn phát sinh',
    enum: transaction_source,
    required: false,
    example: 'SALE',
  })
  @IsOptional()
  @IsEnum(transaction_source, { message: 'Nguồn phát sinh không hợp lệ' })
  transaction_source?: transaction_source;

  @ApiProperty({
    description: 'Trạng thái giao dịch',
    enum: transaction_status,
    required: false,
    example: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(transaction_status, { message: 'Trạng thái không hợp lệ' })
  status?: transaction_status;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: payment_method,
    required: false,
    example: 'CASH',
  })
  @IsOptional()
  @IsEnum(payment_method, { message: 'Phương thức thanh toán không hợp lệ' })
  payment_method?: payment_method;

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

  @ApiProperty({
    description: 'Tìm kiếm theo mã phiếu, tên người liên hệ, hoặc mô tả',
    required: false,
    example: 'PT00001',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiProperty({
    description: 'Số trang (bắt đầu từ 1)',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng bản ghi mỗi trang',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  limit?: number = 20;
}
