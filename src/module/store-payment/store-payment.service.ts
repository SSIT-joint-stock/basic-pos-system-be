import { Injectable } from '@nestjs/common';
import { GenerateVietQRUseCase } from './use-case/generate-vietqr.usecase';
import { CreateStorePaymentDto } from './dto/create-store-payment.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { BadRequestError, ConflictError } from 'app/common/response';
import { UpdateStorePaymentDto } from './dto/update-store-payment.dto';

@Injectable()
export class StorePaymentService {
  private readonly errMsg = {
    NOT_FOUND_STORE:
      'Không tìm thấy cửa hàng cần cấu hình. Vui lòng thử lại sau',
    CONFLICT_STORE_PAYMENT: 'Cửa hàng đã cấu hình thông tin thanh toán',
  };
  constructor(
    private readonly generateVietQRUrl: GenerateVietQRUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async createPaymentInfo(dto: CreateStorePaymentDto, storeId: string) {
    if (!storeId) throw new BadRequestError(this.errMsg.NOT_FOUND_STORE);
    const existing = await this.prisma.storePayment.findFirst({
      where: {
        store_id: storeId,
      },
    });
    if (existing) throw new ConflictError(this.errMsg.CONFLICT_STORE_PAYMENT);
    const qrImageUrl = await this.generateVietQRUrl.execute({
      bank_code: dto.bank_code,
      bank_account_number: dto.bank_account_number,
      bank_name: dto.bank_name,
    });
    const paymentInfo = await this.prisma.storePayment.create({
      data: {
        ...dto,
        bank_qr_image_url: qrImageUrl,
        store_id: storeId,
      },
    });
    return paymentInfo;
  }
  async updatePaymentInfo(dto: UpdateStorePaymentDto, storeId: string) {
    const existing = await this.checkHasStoreId(storeId);
    const qrImageUrl = await this.generateVietQRUrl.execute({
      bank_code: dto.bank_code || existing.bank_code,
      bank_account_number:
        dto.bank_account_number || existing.bank_account_number,
      bank_name: dto.bank_name || existing.bank_name,
    });
    const paymentInfo = await this.prisma.storePayment.update({
      where: {
        id: existing.id,
      },
      data: {
        ...dto,
        bank_qr_image_url: qrImageUrl,
      },
    });
    return paymentInfo;
  }
  async getPaymentInfo(storeId: string) {
    await this.checkHasStoreId(storeId);
    return await this.prisma.storePayment.findFirst({
      where: {
        store_id: storeId,
      },
    });
  }

  private async checkHasStoreId(storeId: string) {
    const existing = await this.prisma.storePayment.findFirst({
      where: {
        store_id: storeId,
      },
    });
    if (!existing) throw new BadRequestError(this.errMsg.NOT_FOUND_STORE);
    return existing;
  }
}
