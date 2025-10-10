import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng là bắt buộc' })
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  // Regex điện thoại "mềm": cho phép +, khoảng trắng, dấu gạch, ngoặc, và 9–20 chữ số
  @Matches(/^\+?[\d\s\-()]{9,20}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Mã ZIP phải gồm đúng 5 chữ số' })
  zip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
