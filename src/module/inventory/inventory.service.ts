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
    INVALID_TYPE_MODIFY_INVENTORY: 'Invalid type modify inventory',
    NO_INVENTORY_FOUND_IN_STORE: 'No inventory found in store',
    INVENTORY_NOT_FOUNG_OR_NOT_ACTIVE: 'Inventory not found or not active',
    RESULT_QUANTY_CAN_NOT_NEGATIVE: 'Resulting quantity cannot be negative',
    CANNOT_MARK_SOLD_WHILE_STOCK_REMAINS:
      'Cannot mark as SOLD while quantity > 0',

    // Product Management
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_NOT_FOUND_OR_NOT_ACTIVE: 'Product not found or not active',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',

    // Authorization
    ONLY_STORE_OWNER_CAN_ADJUST: 'Only the store owner can adjust inventory',
    USER_NOT_IN_STORE: 'Only user in store can do this actions',
    ADJUST_IS_NOT_ALLOW: 'ADJUSTMENT is not allowed here',
    SALE_IS_NOT_ALLOW: 'SALE is not allowed here',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  async findAll(
    store_id: string,
    query: Prisma.InventoryFindManyArgs,
    product_name?: string,
  ) {
    const where: Prisma.InventoryWhereInput = {
      AND: [
        query.where ?? {},
        {
          product: {
            store_id,
            ...(product_name
              ? {
                  OR: [
                    { name: { contains: product_name, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
        },
      ],
    };

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      }),
      this.prisma.inventory.count({
        where,
      }),
    ]);

    return {
      data: inventories,
      total,
    };
  }

  async findById(store_id: string, id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id, product: { store_id } },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });
    if (!inventory) {
      throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);
    }
    return inventory;
  }

  async adjustQuanity(store_id: string, productId: string, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestError(this.errorMessages.DELTA_NON_ZERO_NUMBER);
    }
    const updated = await this.prisma.$transaction(
      async (tx) => {
        // 1) Kiem tra xem product co ton tai hoac active khong khong
        const product = await tx.product.findFirst({
          where: {
            id: productId,
            store_id,
            product_status: 'ACTIVE',
          },
          // select: { id: true, quantity: true },
        });
        if (!product)
          throw new NotFoundError(
            this.errorMessages.PRODUCT_NOT_FOUND_OR_NOT_ACTIVE,
          );

        //2) Kiem tra xem inventory co ton tai hoac active khong
        const inventory = await tx.inventory.findFirst({
          where: {
            product_id: productId,
            status: 'ACTIVE',
            product: {
              store_id,
            },
          },
        });
        if (!inventory)
          throw new NotFoundError(
            this.errorMessages.INVENTORY_NOT_FOUNG_OR_NOT_ACTIVE,
          );

        // 3) Tính số lượng mới & validate
        const newQty = inventory.quantity + delta;
        if (newQty < 0) {
          throw new ConflictError(
            this.errorMessages.RESULT_QUANTY_CAN_NOT_NEGATIVE,
          );
        }

        // 4) Cập nhật inventory trước, rồi tạo stock movement qua service có sẵn
        const updatedInv = await tx.inventory.update({
          where: { id: inventory.id },
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
          productId,
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

  async setStatus(store_id: string, id: string, status: inventory_status) {
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
  async modify(
    type: stock_movement_type,
    store_id: string,
    productId: string,
    delta: number,
    tx?: Prisma.TransactionClient | PrismaService,
  ) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestError(this.errorMessages.DELTA_NON_ZERO_NUMBER);
    }
    const client = tx ?? this.prisma;
    // 1) Kiem tra xem product co ton tai hoac active khong khong
    const product = await client.product.findFirst({
      where: {
        id: productId,
        store_id,
        product_status: 'ACTIVE',
      },
      // select: { id: true, quantity: true },
    });
    if (!product)
      throw new NotFoundError(
        this.errorMessages.PRODUCT_NOT_FOUND_OR_NOT_ACTIVE,
      );
    console.log('asjhadkhakjdshajdshf:', product);

    //2) Kiem tra xem inventory co ton tai hoac active khong
    const inventory = await client.inventory.findFirst({
      where: {
        product_id: productId,
        status: 'ACTIVE',
        product: {
          store_id,
        },
      },
    });
    if (!inventory)
      throw new NotFoundError(
        this.errorMessages.INVENTORY_NOT_FOUNG_OR_NOT_ACTIVE,
      );

    //cac type nhap kho
    if (
      type === stock_movement_type.RETURN_SALE ||
      type === stock_movement_type.PURCHASE ||
      type === stock_movement_type.TRANSFER_IMPORT
    ) {
      const newQty = inventory.quantity + delta;

      const updated = await client.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQty,
        },
      });
      return updated;
    }
    //cac type ma xuat ra khoi kho
    else if (
      type === stock_movement_type.RETURN_PURCHASE ||
      type === stock_movement_type.SALE ||
      type === stock_movement_type.TRANSFER_EXPORT
    ) {
      const newQty = inventory.quantity - delta;
      if (newQty < 0)
        throw new BadRequestError(
          this.errorMessages.RESULT_QUANTY_CAN_NOT_NEGATIVE,
        );
      const updated = await client.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQty,
        },
      });
      return updated;
    }
    // nhung truong hop sai type
    else
      throw new BadRequestError(
        this.errorMessages.INVALID_TYPE_MODIFY_INVENTORY,
      );
  }

  // FIX: nhap theo lo thi sau nay phat trien
  async applyStockMovement(
    type: stock_movement_type,
    store_id: string,
    productId: string,
    delta: number,
  ) {
    if (type === stock_movement_type.ADJUSTMENT) {
      throw new BadRequestError(this.errorMessages.ADJUST_IS_NOT_ALLOW);
    } else if (type === stock_movement_type.SALE) {
      throw new BadRequestError(this.errorMessages.SALE_IS_NOT_ALLOW);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const updatedInventory = await this.modify(
          type,
          store_id,
          productId,
          delta,
          tx,
        );
        await this.stockMovementService.create(
          productId,
          type,
          Math.abs(delta),
          tx,
        );
        return updatedInventory;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
