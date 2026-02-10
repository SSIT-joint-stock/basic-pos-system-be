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
 * DTO để tạo phiếu chi mới
 * Dùng khi: Chi tiền nhập hàng, trả nợ NCC, chi khác
 *
 * LƯU Ý:
 * - store_id: Lấy từ current store trong access token (không cần truyền)
 * - created_by: Lấy từ user đang login trong token (không cần truyền)
 * - reference_id, reference_type: Cho vào query params, không cho vào body
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Số tiền chi (VNĐ)',
    example: 300000,
    minimum: 0,
    maximum: 999999999999.99,
  })
  @IsNotEmpty({ message: 'Số tiền chi không được để trống' })
  @IsNumber({}, { message: 'Số tiền chi phải là số' })
  @Min(0, { message: 'Số tiền chi phải lớn hơn hoặc bằng 0' })
  @Max(999999999999.99, { message: 'Số tiền chi vượt quá giới hạn' })
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
    description: 'Nguồn phát sinh chi tiền',
    enum: transaction_source,
    example: 'PURCHASE',
  })
  @IsNotEmpty({ message: 'Nguồn chi không được để trống' })
  @IsEnum(transaction_source, { message: 'Nguồn chi không hợp lệ' })
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
    example: 'Supplier',
  })
  @IsNotEmpty({ message: 'Loại liên hệ không được để trống' })
  @IsEnum(contact_type, {
    message: 'Loại liên hệ phải là Customer, Supplier, StoreMember hoặc Other',
  })
  contact_type: contact_type;

  @ApiProperty({
    description: 'Lý do chi tiền',
    example: 'Chi tiền nhập hàng',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lý do chi tiền phải là chuỗi' })
  description?: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Thanh toán cho NCC đúng hạn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string;
}
