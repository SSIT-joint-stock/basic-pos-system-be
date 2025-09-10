import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'app/common/response';
import { Prisma, stock_movement_type, inventory_status } from '@prisma/client';
import { StockMovementService } from '../stock-movement/stock-movement.service';

@Injectable()
export class InventoryService {
  private readonly errorMessages = {
    // Inventory Management
    DELTA_NON_ZERO_NUMBER: 'Delta must be a non-zero number',
    INVENTORY_NOT_FOUND: 'Inventory not found',
    INVENTORY_WOULD_GO_NEGATIVE: 'Operation would result in negative inventory',
    INVALID_INVENTORY_STATUS: 'Invalid inventory status',
    NO_INVENTORY_FOUND_IN_STORE: 'No inventory found in store',
    INVENTORY_OR_PRODUCT_NOT_ACTIVE: 'Inventory or product is not active',
    CANNOT_MARK_SOLD_WHILE_STOCK_REMAINS:
      'Cannot mark as SOLD while quantity > 0',

    // Product Management
    PRODUCT_NOT_FOUND: 'Product not found',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',

    // Authorization
    ONLY_STORE_OWNER_CAN_ADJUST: 'Only the store owner can adjust inventory',
    USER_NOT_IN_STORE: 'Only user in store can do this actions',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  async findAll(store_id: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        product: { store_id },
      },
    });
    if (inventories.length === 0)
      throw new NotFoundError(this.errorMessages.NO_INVENTORY_FOUND_IN_STORE);
    return inventories;
  }

  async findById(store_id: string, id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id, product: { store_id } },
    });
    if (!inventory) {
      throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);
    }
    return inventory;
  }

  async adjustQuanity(store_id: string, product_id: string, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestError(this.errorMessages.DELTA_NON_ZERO_NUMBER);
    }
    const updated = await this.prisma.$transaction(
      async (tx) => {
        // 1) Kiem tra xem inventory co ton tai khong
        const existing = await tx.inventory.findFirst({
          where: {
            product_id,
            product: {
              store_id,
            },
          },
          select: { id: true, quantity: true },
        });
        if (!existing)
          throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);

        //2) Kiem tra xem inventory hoac product co active khong
        const isActive = await tx.inventory.findFirst({
          where: {
            id: existing.id,
            status: 'ACTIVE',
            product: { store_id, product_status: 'ACTIVE' },
          },
        });
        if (!isActive)
          throw new BadRequestError(
            this.errorMessages.INVENTORY_OR_PRODUCT_NOT_ACTIVE,
          );

        // 3) Tính số lượng mới & validate
        const newQty = existing.quantity + delta;
        if (newQty < 0) {
          throw new ConflictError('Resulting quantity cannot be negative');
        }

        // 4) Cập nhật inventory trước, rồi tạo stock movement qua service có sẵn
        const updatedInv = await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: newQty },
          select: {
            id: true,
            quantity: true,
            product_id: true,
            status: true,
            updatedAt: true,
          },
        });
        await this.stockMovementService.create(
          product_id,
          stock_movement_type.ADJUSTMENT,
          Math.abs(delta),
          tx,
        );

        return updatedInv;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return updated;
  }

  async setSatus(store_id: string, id: string, status: inventory_status) {
    // 1) Lấy inventory hiện tại
    const inventory = await this.prisma.inventory.findUnique({
      where: { id, product: { store_id } },
      select: {
        id: true,
        product_id: true,
        quantity: true,
        discount: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            store_id: true,
          },
        },
      },
    });
    if (!inventory) {
      throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);
    }

    // 2) Idempotent: nếu không đổi trạng thái, trả về luôn
    if (inventory.status === status) {
      return inventory;
    }

    // 3) Cập nhật trạng thái
    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: { status },
      select: {
        id: true,
        product_id: true,
        quantity: true,
        discount: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async revalue(
    store_id: string,
    inventory_id: string,
    data: { discount?: number; total?: number },
  ) {
    const { discount, total } = data ?? {};
    const updated = await this.prisma.$transaction(
      async (tx) => {
        // 1) Lấy inventory + product(store_id)
        const inv = await tx.inventory.findUnique({
          where: { id: inventory_id, product: { store_id } },
          select: {
            id: true,
            product_id: true,
            discount: true,
            total: true,
            status: true,
            product: { select: { store_id: true } },
          },
        });
        if (!inv) {
          throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);
        }

        // 2) Build patch (idempotent: nếu không đổi gì, trả về luôn)
        const patch: Record<string, number> = {};
        if (discount !== undefined && discount !== inv.discount)
          patch.discount = discount;
        if (total !== undefined && total !== inv.total) patch.total = total;

        if (Object.keys(patch).length === 0) {
          // Không có thay đổi
          return {
            id: inv.id,
            product_id: inv.product_id,
            discount: inv.discount,
            total: inv.total,
            status: inv.status,
          };
        }

        // 4) Cập nhật inventory (không ảnh hưởng quantity)
        const row = await tx.inventory.update({
          where: { id: inv.id },
          data: patch,
          select: {
            id: true,
            product_id: true,
            quantity: true,
            discount: true,
            total: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return row;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return updated;
  }
}
