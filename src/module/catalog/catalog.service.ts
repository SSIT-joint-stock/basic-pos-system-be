import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  async scanBarcode(storeId: string, barcode: string) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        barcode: barcode,
        product: {
          store_id: storeId,
        },
      },
      include: {
        product: true,
        variant_stocks: true,
        conversions: true,
      },
    });

    if (!variant) {
      throw new NotFoundError(`Sản phẩm có mã vach ${barcode} không tồn tại`);
    }

    const stock = variant?.variant_stocks?.find(
      (stock) => stock.store_id === storeId,
    );
    return {
      ...variant,
      onHand: stock?.onHand ?? 0,
      reserved: stock?.reserved ?? 0,
      damaged: stock?.damaged ?? 0,
      variant_stocks: undefined,
    };
  }
}
