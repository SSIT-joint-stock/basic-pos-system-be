import { Injectable } from '@nestjs/common';
import { Prisma, stock_movement_type } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import { StockMovementService } from 'app/module/stock-movement/stock-movement.service';
import { PrismaService } from 'app/prisma/prisma.service';

enum StockErrorMessage {
  PRODUCT_NOT_FOUND = 'Sản phẩm không tồn tại hoặc không hoạt động!',
  VARIANT_NOT_FOUND = 'Biến thể sản phẩm không tồn tại!',
  VARIANT_STOCK_NOT_FOUND = 'Tồn kho biến thể không tồn tại!',
  DELTA_INVALID = 'Số lượng thay đổi phải là số hợp lệ!',
  INSUFFICIENT_STOCK = 'Tồn kho không đủ để thực hiện giao dịch này!',
  INVALID_STOCK_MOVEMENT_TYPE = 'Loại chuyển động kho không hợp lệ!',
}

interface StockMovementConfig {
  isIncoming: boolean; // true: tăng tồn, false: giảm tồn
  usesAbsoluteValue: boolean; // true: dùng Math.abs(delta), false: dùng delta nguyên bản
}

@Injectable()
export class ApplyStockUseCase {
  // Mapping loại chuyển động với cấu hình tương ứng
  private readonly stockMovementConfig: Record<
    stock_movement_type,
    StockMovementConfig
  > = {
    [stock_movement_type.ADJUSTMENT]: {
      isIncoming: true,
      usesAbsoluteValue: false,
    },
    [stock_movement_type.PURCHASE]: {
      isIncoming: true,
      usesAbsoluteValue: true,
    },
    [stock_movement_type.RETURN_SALE]: {
      isIncoming: true,
      usesAbsoluteValue: true,
    },
    [stock_movement_type.TRANSFER_IMPORT]: {
      isIncoming: true,
      usesAbsoluteValue: true,
    },
    [stock_movement_type.SALE]: { isIncoming: false, usesAbsoluteValue: true },
    [stock_movement_type.RETURN_PURCHASE]: {
      isIncoming: false,
      usesAbsoluteValue: true,
    },
    [stock_movement_type.TRANSFER_EXPORT]: {
      isIncoming: false,
      usesAbsoluteValue: true,
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  /**
   * Áp dụng chuyển động kho cho một biến thể sản phẩm
   * @param type - Loại chuyển động kho
   * @param storeId - ID cửa hàng
   * @param variantId - ID biến thể sản phẩm
   * @param delta - Số lượng thay đổi (có dấu hoặc không dấu tùy loại)
   */
  async execute(
    type: stock_movement_type,
    storeId: string,
    variantId: string,
    productId: string,
    delta: number,
    tx: Prisma.TransactionClient,
  ) {
    await Promise.all([
      this.validateDelta(delta),
      this.validateMovementType(type),
    ]);
    // Check variant exists and is active
    await this.validateVariant(variantId, productId, storeId, tx);

    // Get or create variant stock
    let variantStock = await this.getVariantStock(variantId, storeId, tx);

    if (!variantStock) {
      variantStock = await this.createVariantStock(variantId, storeId, tx);
    }

    // Calculate new stock quantity
    const config = this.stockMovementConfig[type];
    const quantityDelta = config.usesAbsoluteValue ? Math.abs(delta) : delta;

    const newOnHand = config.isIncoming
      ? variantStock.onHand + quantityDelta
      : variantStock.onHand - quantityDelta;

    // Validate result quantity
    if (newOnHand < 0) {
      throw new ConflictError(StockErrorMessage.INSUFFICIENT_STOCK);
    }

    // Update variant stock
    const updatedStock = await tx.variantStock.update({
      where: { id: variantStock.id },
      data: { onHand: newOnHand },
    });

    // Record stock movement
    const movementQuantity = config.usesAbsoluteValue ? Math.abs(delta) : delta;

    await this.stockMovementService.create(
      variantId,
      type,
      movementQuantity,
      tx,
    );

    return updatedStock;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate delta is a finite non-zero number
   */
  private validateDelta(delta: number): void {
    if (!Number.isFinite(delta)) {
      throw new BadRequestError(StockErrorMessage.DELTA_INVALID);
    }
  }

  /**
   * Validate stock movement type exists
   */
  private validateMovementType(type: stock_movement_type): void {
    if (!Object.values(stock_movement_type).includes(type)) {
      throw new BadRequestError(StockErrorMessage.INVALID_STOCK_MOVEMENT_TYPE);
    }
  }

  /**
   * Validate that variant exists and product is active
   */
  private async validateVariant(
    variantId: string,
    productId: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const variant = await tx.variant.findFirst({
      where: {
        id: variantId,
        product_id: productId,
        product: {
          store_id: storeId,
          product_status: 'ACTIVE',
        },
      },
    });

    if (!variant) {
      throw new NotFoundError(StockErrorMessage.VARIANT_NOT_FOUND);
    }
  }

  /**
   * Get variant stock for a specific store
   */
  private async getVariantStock(
    variantId: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.variantStock.findUnique({
      where: {
        variant_id_store_id: {
          variant_id: variantId,
          store_id: storeId,
        },
      },
    });
  }

  /**
   * Create new variant stock record
   */
  private async createVariantStock(
    variantId: string,
    storeId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.variantStock.create({
      data: {
        variant_id: variantId,
        store_id: storeId,
        onHand: 0,
        reserved: 0,
        damaged: 0,
      },
    });
  }
}
