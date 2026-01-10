import { Injectable } from '@nestjs/common';
import {
  Prisma,
  purchase_order_status,
  purchase_return_status,
  stock_movement_type,
  Variant,
  VariantStock,
} from '@prisma/client';
import { BadRequestError, NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { PurchaseReturnDto } from 'app/module/purchase-return/dto/purchase-return.dto';
import { GeneratePurchaseReturnNumberUseCase } from 'app/module/purchase-return/usecase/generate-return-number.use.case';
import { ApplyStockUseCase } from 'app/module/variant/use-case/apply-stock.usecase';
import { PrismaService } from 'app/prisma/prisma.service';

type PurchaseReturnItemInput = Omit<
  Prisma.PurchaseReturnItemUncheckedCreateInput,
  'id' | 'purchase_return_id'
>;
type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{
  include: {
    items: true;
  };
}>;

@Injectable()
export class PurchaseReturnService {
  private readonly errMsg = {
    STORE_NOT_FOUND: 'Không tìm thấy cửa hàng',
    INVALID_ITEM_DATA: 'Không có sản phẩm trong đơn xuất/trả. Vui lòng thử lại',
    PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy đơn nhập hàng',
    PURCHASE_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong đơn nhập',
    PRODUCT_OR_VARIANT_NOT_FOUND: 'Không tìm thấy sản phẩm hoặc biến thể',
    SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp',
    PURCHASE_RETURN_NOT_FOUND: 'Không tìm thấy đơn xuất/trả',
    QUANTITY_INPT_NOT_VALID: 'Số lượng xuất không đươc lớn hơn số lượng nhập',
    QUANTITY_NOT_VALID: 'Số lượng không hợp lệ',
    PURCHASE_ORDER_NOT_ACCEPTED: 'Đơn hàng nhập hiện chưa được duyệt',
    VARIANT_NOT_FOUND: 'Sản phẩm/biến thể không tìm thấy hoặc không tồn tai!',
    VARIANT_STOCK_NOT_FOUND: 'Tồn kho không tồn tại. Vui lòng thử lại!',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly applyStock: ApplyStockUseCase,
    private readonly generateReturnNumber: GeneratePurchaseReturnNumberUseCase,
  ) {}

  async createWithPurchaseOrder(
    purchaseOrderId: string,
    dto: PurchaseReturnDto,
    storeId: string,
    user: IUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.checkAccessStore(storeId);
      const items = this.checkHasItem(dto);
      const purchaseOrder = await this.checkPurchaseOrder(purchaseOrderId, tx);
      const supplier = await this.checkSupplier(purchaseOrder.supplier_id, tx);

      const purchaseReturnItems: PurchaseReturnItemInput[] = [];
      for (const item of items) {
        const { item_name, purchase_order_item_id, quantity, reason } = item;

        const { inputQty, purchaseOrderItem } =
          this.checkValidQuantityInPurchaseOrder(
            quantity,
            purchaseOrder,
            purchase_order_item_id,
          );
        const itemTotal = inputQty.mul(purchaseOrderItem.unit_cost);

        purchaseReturnItems.push({
          variant_id: purchaseOrderItem.variant_id,
          product_id: purchaseOrderItem.product_id,
          purchase_order_item_id: purchaseOrderItem.id,
          item_name: purchaseOrderItem.item_name || item_name,
          quantity: Number(inputQty),
          unit_cost: purchaseOrderItem.unit_cost,
          total: itemTotal,
          reason,
        });

        await this.applyStock.execute(
          stock_movement_type.RETURN_PURCHASE,
          storeId,
          purchaseOrderItem.variant_id,
          purchaseOrderItem.product_id,
          Number(inputQty) || 0,
          tx,
        );

        await tx.purchaseOrderItem.update({
          where: { id: purchaseOrderItem.id },
          data: {
            quantity_returned:
              purchaseOrderItem.quantity_returned === null
                ? inputQty
                : { increment: inputQty },
          },
        });
      }

      const total = purchaseReturnItems.reduce(
        (acc, item) => acc.add(Number(item.total)),
        new Prisma.Decimal(0),
      );

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          store_id: storeId,
          return_number:
            await this.generateReturnNumber.generateNumberReturn(storeId),
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_code: supplier.code || '',
          created_by: user.id,
          status: purchase_return_status.COMPLETED,
          reason: dto.reason,
          notes: dto.notes,
          total: total,
          purchase_order_id: purchaseOrder.id,
          items: {
            createMany: {
              data: purchaseReturnItems,
            },
          },
        },
      });

      return purchaseReturn;
    });
  }
  async createWithoutPurchaseOrder(
    storeId: string,
    dto: PurchaseReturnDto,
    user: IUser,
  ) {
    await this.checkAccessStore(storeId);
    return this.prisma.$transaction(async (tx) => {
      const items = this.checkHasItem(dto);

      const purchaseReturnItems: PurchaseReturnItemInput[] = [];

      for (const item of items) {
        const {
          item_name,
          quantity,
          unit_cost,
          reason,
          variant_id,
          product_id,
        } = item;
        const { inputQty, variant } =
          await this.checkValidQuantityInVariantStock(
            tx,
            quantity,
            variant_id!,
            storeId,
          );

        if (!variant_id || !product_id)
          throw new BadRequestError(this.errMsg.PRODUCT_OR_VARIANT_NOT_FOUND);

        const totalPerItem = inputQty.mul(item.unit_cost);

        purchaseReturnItems.push({
          variant_id: variant_id,
          product_id: product_id,
          item_name: variant.name || item_name,
          quantity: Number(inputQty),
          total: totalPerItem,
          unit_cost: unit_cost || Number(variant.cost),
          reason,
        });
        await this.applyStock.execute(
          stock_movement_type.RETURN_PURCHASE,
          storeId,
          variant_id,
          product_id,
          Number(inputQty) || 0,
          tx,
        );
      }
      const total = purchaseReturnItems.reduce(
        (acc, item) => acc.add(Number(item.total)),
        new Prisma.Decimal(0),
      );
      const supplier = await this.checkSupplier(dto.supplier_id || '', tx);
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          store_id: storeId,
          return_number:
            await this.generateReturnNumber.generateNumberReturn(storeId),
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_code: supplier.code || '',
          created_by: user.id,
          status: purchase_return_status.COMPLETED,
          reason: dto.reason,
          notes: dto.notes,
          total: total,
          items: {
            createMany: {
              data: purchaseReturnItems,
            },
          },
        },
      });

      return purchaseReturn;
    });
  }

  async getPurchaseReturn(storeId: string, purchaseReturnId: string) {
    await this.checkAccessStore(storeId);
    const purchaseReturn = await this.prisma.purchaseReturn.findUnique({
      where: {
        store_id: storeId,
        id: purchaseReturnId,
      },
    });
    if (!purchaseReturn)
      throw new NotFoundError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);
    return purchaseReturn;
  }

  async getAllPurchaseReturn(
    storeId: string,
    query: Prisma.PurchaseReturnFindManyArgs,
  ) {
    await this.checkAccessStore(storeId);
    const where: Prisma.PurchaseReturnWhereInput = {
      AND: [
        query.where ?? {},
        {
          store_id: storeId,
        },
      ],
    };
    const [purchaseReturn, count] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
        include: {
          supplier: true,
          items: true,
          creator: true,
        },
      }),
      this.prisma.purchaseReturn.count({
        where,
      }),
    ]);

    return {
      data: purchaseReturn,
      total: count,
    };
  }

  // ================== PRIVATE FUNCTION ==================
  private async checkAccessStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new NotFoundError(this.errMsg.STORE_NOT_FOUND);
    return store;
  }

  private checkHasItem(dto: PurchaseReturnDto) {
    const { items } = dto;
    if (!items.length) throw new NotFoundError(this.errMsg.INVALID_ITEM_DATA);
    return items;
  }

  private async checkPurchaseOrder(
    purchaseOrderId: string,
    tx: Prisma.TransactionClient,
  ) {
    const purchaseOrder = await tx.purchaseOrder.findUnique({
      where: {
        id: purchaseOrderId,
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (!purchaseOrder)
      throw new NotFoundError(this.errMsg.PURCHASE_ORDER_NOT_FOUND);

    if (purchaseOrder.status === purchase_order_status.PENDING) {
      throw new BadRequestError(this.errMsg.PURCHASE_ORDER_NOT_ACCEPTED);
    }

    return purchaseOrder;
  }

  private async checkSupplier(
    supplierId: string,
    tx: Prisma.TransactionClient,
  ) {
    const supplier = await tx.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });
    if (!supplier) throw new NotFoundError(this.errMsg.SUPPLIER_NOT_FOUND);

    return supplier;
  }

  private checkValidQuantityInPurchaseOrder(
    quantity: number,
    purchaseOrder: PurchaseOrderWithItems,
    purchase_order_item_id?: string,
  ) {
    const inputQty = new Prisma.Decimal(quantity);

    const purchaseOrderItem = purchaseOrder.items.find(
      (i) => i.id === purchase_order_item_id,
    );

    if (!purchaseOrderItem)
      throw new NotFoundError(this.errMsg.PURCHASE_ITEM_NOT_FOUND);

    const returnedQty =
      purchaseOrderItem.quantity_returned ?? new Prisma.Decimal(0);
    const maxReturnableQty = purchaseOrderItem.quantity.sub(returnedQty);

    if (inputQty.gt(maxReturnableQty)) {
      throw new BadRequestError(
        this.errMsg.QUANTITY_INPT_NOT_VALID + ' ' + purchaseOrderItem.item_name,
      );
    }

    return { inputQty, purchaseOrderItem, maxReturnableQty };
  }

  private async checkValidQuantityInVariantStock(
    tx: Prisma.TransactionClient,
    quantity: number,
    variantId: string,
    storeId: string,
  ): Promise<{
    inputQty: Prisma.Decimal;
    variant: Variant;
    variantStock: VariantStock;
    onHand: Prisma.Decimal;
  }> {
    const inputQty = new Prisma.Decimal(quantity);

    const variant = await tx.variant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new BadRequestError(this.errMsg.VARIANT_NOT_FOUND);

    const variantStock = await tx.variantStock.findUnique({
      where: {
        variant_id_store_id: {
          variant_id: variant.id,
          store_id: storeId,
        },
      },
    });

    if (!variantStock)
      throw new BadRequestError(this.errMsg.VARIANT_STOCK_NOT_FOUND);

    const onHand = new Prisma.Decimal(variantStock.onHand ?? 0);

    if (onHand.lt(inputQty))
      throw new BadRequestError(
        `${this.errMsg.QUANTITY_INPT_NOT_VALID}: ${onHand} ${variant.name}`,
      );

    return { inputQty, variant, variantStock, onHand };
  }
}
