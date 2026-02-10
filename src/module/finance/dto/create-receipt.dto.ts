import { ApiProperty } from '@nestjs/swagger';
import {
  contact_type,
  payment_method,
  transaction_source,
} from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO để tạo phiếu thu mới
 * Dùng khi: Thu tiền bán hàng, thu công nợ, thu khác
 *
 * LƯU Ý:
 * - store_id: Lấy từ current store trong access token (không cần truyền)
 * - created_by: Lấy từ user đang login trong token (không cần truyền)
 * - reference_id, reference_type: Chỉ set tự động từ module khác (không cho phép truyền)
 */
export class CreateReceiptDto {
  @ApiProperty({
    description: 'Số tiền thu (VNĐ)',
    example: 500000,
    minimum: 0,
    maximum: 999999999999.99,
  })
  @IsNotEmpty({ message: 'Số tiền thu không được để trống' })
  @IsNumber({}, { message: 'Số tiền thu phải là số' })
  @Min(0, { message: 'Số tiền thu phải lớn hơn hoặc bằng 0' })
  @Max(999999999999.99, { message: 'Số tiền thu vượt quá giới hạn' })
  amount: number;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: payment_method,
    example: 'CASH',
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(payment_method, { message: 'Phương thức thanh toán không hợp lệ' })
  payment_method: payment_method;

  @ApiProperty({
    description: 'Nguồn phát sinh thu tiền',
    enum: transaction_source,
    example: 'SALE',
  })
  @IsNotEmpty({ message: 'Nguồn thu không được để trống' })
  @IsEnum(transaction_source, { message: 'Nguồn thu không hợp lệ' })
  transaction_source: transaction_source;

  @ApiProperty({
    description:
      'ID khách hàng/nhà cung cấp (hệ thống sẽ tự động lấy tên từ database) (Optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  contact_id?: string;

  @ApiProperty({
    description: 'Tên người liên hệ (Optional)',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên liên hệ phải là chuỗi' })
  contact_name?: string;

  @ApiProperty({
    description: 'Loại người liên hệ',
    enum: contact_type,
    example: 'Customer',
  })
  @IsNotEmpty({ message: 'Loại liên hệ không được để trống' })
  @IsEnum(contact_type, {
    message: 'Loại liên hệ phải là Customer, Supplier, StoreMember hoặc Other',
  })
  contact_type: contact_type;

  @ApiProperty({
    description: 'Lý do thu tiền',
    example: 'Thu tiền bán hàng',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lý do thu tiền phải là chuỗi' })
  description?: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Khách thanh toán đúng hạn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string;
}
