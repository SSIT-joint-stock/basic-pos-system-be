import { IsNotEmpty, IsOptional, IsString, IsUppercase } from 'class-validator';

export class ConfigPaymentInfo {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập mã ngân hàng',
  })
  bank_code: string;
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tên ngân hàng',
  })
  bank_name: string;
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập số tài khoản ngân hàng',
  })
  bank_account_number: string;
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng nhập tài khoản ngân hàng',
  })
  @IsUppercase()
  bank_account_name: string;
  @IsOptional()
  bank_qr_image_url?: string;
  @IsOptional()
  note?: string;
}
