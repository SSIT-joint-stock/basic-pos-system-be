import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ApplyRewardPointDto } from './dto/apply-reward-point.dto';

@Injectable()
export class StoreRewardPointService {
  constructor(private readonly prisma: PrismaService) {}
  async configRewardPoint(storeId: string, dto: ApplyRewardPointDto) {
    if (!storeId) return;
    const existed = await this.prisma.storeRewardPoint.findFirst({
      where: { store_id: storeId },
    });

    // nếu chưa có thì tạo mới
    if (!existed) {
      return await this.prisma.storeRewardPoint.create({
        data: {
          store_id: storeId,
          is_apply: dto.is_apply ?? false,
          convert_rate: dto.convert_rate ?? 0,
          point_value: dto.point_value ?? 0,
          description: dto.description ?? '',
        },
      });
    }

    // nếu có rồi thì update
    return await this.prisma.storeRewardPoint.update({
      where: { id: existed.id },
      data: dto,
    });
  }
  async getPaymentInfo(storeId: string) {
    return await this.prisma.storeRewardPoint.findFirst({
      where: { store_id: storeId },
    });
  }
}
