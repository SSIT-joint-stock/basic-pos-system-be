/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'app/common/response';
import {
  Prisma,
  stock_movement_type,
  inventory_status,
  StoreMemberRole,
} from '@prisma/client';
import { waitForDebugger } from 'inspector';

@Injectable()
export class InventoryService {
  private readonly errorMessages = {
    // Inventory Management
    DELTA_NON_ZERO_NUMBER: 'Delta must be a non-zero number',
    INVENTORY_NOT_FOUND: 'Inventory not found',
    INVENTORY_WOULD_GO_NEGATIVE: 'Operation would result in negative inventory',
    INVALID_INVENTORY_STATUS: 'Invalid inventory status',
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

  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma;
  }
  private async ensureUserInStore(
    db: Prisma.TransactionClient | typeof this.db,
    userId: string,
    storeId: string,
    allowedRoles: StoreMemberRole[] = [
      StoreMemberRole.OWNER,
      StoreMemberRole.MEMBER,
    ],
  ): Promise<StoreMemberRole> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { owner_id: true },
    });
    if (!store) throw new NotFoundError(this.errorMessages.STORE_NOT_FOUND);

    // Chủ store luôn được coi là OWNER
    if (
      allowedRoles.includes(StoreMemberRole.OWNER) &&
      store.owner_id === userId
    ) {
      return StoreMemberRole.OWNER;
    }

    // Kiểm tra membership
    const membership = await db.storeMember.findUnique({
      where: { storeId_userId: { storeId, userId } }, // vì @@id([storeId, userId])
      select: { role: true },
    });

    if (membership && allowedRoles.includes(membership.role)) {
      return membership.role;
    }

    throw new ForbiddenError(this.errorMessages.USER_NOT_IN_STORE);
  }

  async findAll(store_id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: store_id },
    });
    if (!store) {
      throw new NotFoundError(this.errorMessages.STORE_NOT_FOUND);
    }

    const inventories = await this.prisma.inventory.findMany({
      where: {
        product: { store_id: store_id },
      },
    });
    return inventories;
  }

  async findById(id: string) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id } });
    if (!inventory) {
      throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);
    }
    return inventory;
  }

  async adjustQuanity(userId: string, product_id: string, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestError(this.errorMessages.DELTA_NON_ZERO_NUMBER);
    }
    const updated = await this.prisma.$transaction(
      async (tx) => {
        // 1) Lấy product để biết store_id
        const product = await tx.product.findUnique({
          where: { id: product_id },
          select: { id: true, store_id: true },
        });
        if (!product)
          throw new NotFoundError(this.errorMessages.PRODUCT_NOT_FOUND);

        // 2) Kiểm tra owner của store
        await this.ensureUserInStore(tx, userId, product.store_id, [
          StoreMemberRole.OWNER,
        ]);

        // 3) Lấy inventory ACTIVE của product //FIX: (nếu bạn quản lý theo status)
        const inv = await tx.inventory.findFirst({
          where: { product_id, status: 'ACTIVE' },
          select: { id: true, quantity: true },
        });
        if (!inv)
          throw new NotFoundError(this.errorMessages.INVENTORY_NOT_FOUND);

        // 4) Tính số lượng mới & validate
        const newQty = inv.quantity + delta;
        if (newQty < 0) {
          throw new ConflictError('Resulting quantity cannot be negative');
        }

        // 5) Nested write: Cập nhật inventory + tạo stock movement trong 1 lệnh
        const updatedProduct = await tx.product.update({
          where: { id: product_id },
          data: {
            inventories: {
              update: {
                where: { id: inv.id },
                data: { quantity: newQty },
              },
            },
            stock_movements: {
              create: {
                // product_id tự gắn theo quan hệ từ Product
                quantity: delta, // dương = nhập, âm = xuất (giữ nguyên dấu nếu bạn muốn)
                type: stock_movement_type.ADJUSTMENT,
              },
            },
          },
          include: {
            inventories: true, // nếu chỉ cần inventory vừa sửa, có thể select/locate theo id
          },
        });

        return updatedProduct;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return updated;
  }

  async setSatus(userId: string, id: string, status: inventory_status) {
    //0) Validate input
    if (!Object.values(inventory_status).includes(status)) {
      throw new BadRequestError(this.errorMessages.INVALID_INVENTORY_STATUS);
    }

    // 1) Lấy inventory hiện tại
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
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

    // 2) User thuộc store (owner hoặc member)
    await this.ensureUserInStore(
      this.prisma,
      userId,
      inventory.product.store_id,
    );

    // 3) Rule nghiệp vụ (gợi ý): không cho set SOLD nếu vẫn còn tồn
    if (status === inventory_status.SOLD && inventory.quantity > 0) {
      throw new ConflictError(
        this.errorMessages.CANNOT_MARK_SOLD_WHILE_STOCK_REMAINS,
      );
    }

    // 4) Idempotent: nếu không đổi trạng thái, trả về luôn
    if (inventory.status === status) {
      return inventory;
    }

    // 5) Cập nhật trạng thái
    const updated = await this.prisma.inventory.update({
      where: { id },
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
    userId: string,
    inventory_id: string,
    data: { discount?: number; total?: number },
  ) {
    const { discount, total } = data ?? {};
    const updated = await this.prisma.$transaction(
      async (tx) => {
        // 1) Lấy inventory + product(store_id)
        const inv = await tx.inventory.findUnique({
          where: { id: inventory_id },
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

        // 2) Chỉ OWNER được revalue (đổi allowedRoles nếu muốn cho member)
        await this.ensureUserInStore(tx, userId, inv.product.store_id, [
          StoreMemberRole.OWNER,
        ]);

        // 3) Build patch (idempotent: nếu không đổi gì, trả về luôn)
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
