import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateReceiptDto } from './create-receipt.dto';

/**
 * DTO để cập nhật giao dịch (Receipt hoặc Payment)
 * Kế thừa từ CreateReceiptDto nhưng tất cả fields đều optional
 * Loại bỏ store_id và created_by (không cho phép update)
 */
export class UpdateTransactionDto extends PartialType(
  OmitType(CreateReceiptDto, ['store_id', 'created_by'] as const),
) {}
