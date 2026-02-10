import { PartialType } from '@nestjs/swagger';
import { CreateReceiptDto } from './create-receipt.dto';

export class UpdateTransactionDto extends PartialType(CreateReceiptDto) {}
