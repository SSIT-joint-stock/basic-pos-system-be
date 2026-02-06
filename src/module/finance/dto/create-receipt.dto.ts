import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { transaction_source, payment_method } from '@prisma/client';

/**
 * DTO để tạo phiếu thu mới
 * Dùng khi: Thu tiền bán hàng, thu công nợ, thu khác
 */
export class CreateReceiptDto {
  @ApiProperty({
    description: 'ID cửa hàng',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID cửa hàng không được để trống' })
  @IsUUID('4', { message: 'ID cửa hàng không hợp lệ' })
  store_id: string;

  @ApiProperty({
    description: 'Số tiền thu (VNĐ)',
    example: 500000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Số tiền thu không được để trống' })
  @IsNumber({}, { message: 'Số tiền thu phải là số' })
  @Min(0, { message: 'Số tiền thu phải lớn hơn hoặc bằng 0' })
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
    description: 'Tên người nộp tiền',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty({ message: 'Tên người nộp tiền không được để trống' })
  @IsString({ message: 'Tên người nộp tiền phải là chuỗi' })
  contact_name: string;

  @ApiProperty({
    description: 'Lý do thu tiền',
    example: 'Thu tiền bán hàng đơn DH00001',
  })
  @IsNotEmpty({ message: 'Lý do thu tiền không được để trống' })
  @IsString({ message: 'Lý do thu tiền phải là chuỗi' })
  description: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Khách thanh toán đúng hạn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string;

  @ApiProperty({
    description: 'ID đơn hàng/phiếu liên quan',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID tham chiếu không hợp lệ' })
  reference_id?: string;

  @ApiProperty({
    description: 'Loại tham chiếu (Order, PurchaseOrder, OrderReturn...)',
    example: 'Order',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Loại tham chiếu phải là chuỗi' })
  reference_type?: string;

  @ApiProperty({
    description: 'ID khách hàng/nhà cung cấp',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID liên hệ không hợp lệ' })
  contact_id?: string;

  @ApiProperty({
    description: 'Loại người liên hệ (Customer, Supplier, Other)',
    example: 'Customer',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Loại liên hệ phải là chuỗi' })
  contact_type?: string;

  @ApiProperty({
    description: 'ID người tạo phiếu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID người tạo không được để trống' })
  @IsUUID('4', { message: 'ID người tạo không hợp lệ' })
  created_by: string;
}
