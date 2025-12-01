import { Injectable } from '@nestjs/common';
import { GenerateVietQRUseCase } from './use-case/generate-vietqr.usecase';
import { ConfigPaymentInfo } from './dto/config-payment-info';
import { PrismaService } from 'app/prisma/prisma.service';
import { BadRequestError } from 'app/common/response';

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

  async configPaymentStore(dto: ConfigPaymentInfo, storeId: string) {
    if (!storeId) throw new BadRequestError(this.errMsg.NOT_FOUND_STORE);
    const qrUrl = await this.generateVietQRUrl.execute(dto);
    const existing = await this.prisma.storePayment.findFirst({
      where: {
        store_id: storeId,
      },
    });

    if (existing) {
      return await this.prisma.storePayment.update({
        where: {
          id: existing.id,
        },
        data: {
          ...dto,
          bank_account_name: dto.bank_account_name.toLocaleUpperCase(),
          bank_qr_image_url: qrUrl,
        },
      });
    }

    return await this.prisma.storePayment.create({
      data: {
        ...dto,
        store_id: storeId,
        bank_account_name: dto.bank_account_name.toLocaleUpperCase(),
        bank_qr_image_url: qrUrl,
      },
    });
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
