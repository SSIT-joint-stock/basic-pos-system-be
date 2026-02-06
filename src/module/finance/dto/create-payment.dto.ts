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
 * DTO để tạo phiếu chi mới
 * Dùng khi: Chi tiền nhập hàng, chi trả hàng, chi phí khác
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID cửa hàng',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID cửa hàng không được để trống' })
  @IsUUID('4', { message: 'ID cửa hàng không hợp lệ' })
  store_id: string;

  @ApiProperty({
    description: 'Số tiền chi (VNĐ)',
    example: 300000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Số tiền chi không được để trống' })
  @IsNumber({}, { message: 'Số tiền chi phải là số' })
  @Min(0, { message: 'Số tiền chi phải lớn hơn hoặc bằng 0' })
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
    description: 'Tên người nhận tiền',
    example: 'Công ty TNHH ABC',
  })
  @IsNotEmpty({ message: 'Tên người nhận tiền không được để trống' })
  @IsString({ message: 'Tên người nhận tiền phải là chuỗi' })
  contact_name: string;

  @ApiProperty({
    description: 'Lý do chi tiền',
    example: 'Chi tiền nhập hàng phiếu PN00001',
  })
  @IsNotEmpty({ message: 'Lý do chi tiền không được để trống' })
  @IsString({ message: 'Lý do chi tiền phải là chuỗi' })
  description: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Đã kiểm tra hàng trước khi thanh toán',
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
    description: 'Loại tham chiếu (PurchaseOrder, OrderReturn...)',
    example: 'PurchaseOrder',
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
    example: 'Supplier',
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
