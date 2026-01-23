import { payment_method } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AcceptPaymentReturn {
  @IsString()
  @IsNotEmpty({
    message: 'Vui lòng chọn phươn thức thanh toán',
  })
  payment_method: payment_method;

  @IsOptional()
  amount?: number;

  @IsOptional()
  payment_date?: Date;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
