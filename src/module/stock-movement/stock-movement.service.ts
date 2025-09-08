import { Injectable } from '@nestjs/common';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { Prisma, stock_movement_type, StoreMemberRole } from '@prisma/client';

@Injectable()
export class StockMovementService {
  private readonly errorMessages = {
    //Stock_movement Management
    QUANTITY_NON_ZERO_NUMBER: 'Delta must be a non-zero number',

    //Product Management
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_NOT_FOUND_OR_NOT_ACTIVE: 'Product not found or not active',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',

    // Authorization
    ONLY_STORE_OWNER_CAN_ADJUST: 'Only the store owner can adjust inventory',
    USER_NOT_IN_STORE: 'Only user in store can do this actions',
  };

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

  private getAllowedRolesByMovementType(
    type: stock_movement_type,
  ): StoreMemberRole[] {
    switch (type) {
      case 'ADJUSTMENT':
      case 'TRANSFER':
        // chỉ OWNER mới được phép
        return [StoreMemberRole.OWNER];

      case 'PURCHASE':
      case 'SALE':
      case 'RETURN_PURCHASE':
      case 'RETURN_SALE':
        // MEMBER và OWNER đều được phép
        return [StoreMemberRole.MEMBER, StoreMemberRole.OWNER];

      default:
        // an toàn: chỉ OWNER
        return [StoreMemberRole.OWNER];
    }
  }

  constructor(private readonly prisma: PrismaService) {}

  async create(
    product_id: string,
    type: stock_movement_type,
    quantity: number,
    tx: Prisma.TransactionClient | typeof this.db,
  ) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestError(this.errorMessages.QUANTITY_NON_ZERO_NUMBER);
    }
    const stockMovement = await tx.stockMovement.create({
      data: {
        product_id: product_id,
        type: type,
        quantity: quantity,
      },
    });
    return stockMovement;
  }

  async findAllByStoreId(userId: string, store_id: string) {
    // 1) permission: OWNER (or MEMBER) — tweak as needed
    await this.ensureUserInStore(this.prisma, userId, store_id, [
      StoreMemberRole.OWNER,
    ]);

    // 2) find
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        product: {
          store_id: store_id,
        },
      },
    });
    return stockMovements;
  }

  findOne(id: string) {
    return this.prisma.stockMovement.findUnique({
      where: { id },
    });
  }
}
