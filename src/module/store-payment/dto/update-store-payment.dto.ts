import { PartialType } from '@nestjs/mapped-types';
import { CreateStorePaymentDto } from './create-store-payment.dto';

export class UpdateStorePaymentDto extends PartialType(CreateStorePaymentDto) {}
