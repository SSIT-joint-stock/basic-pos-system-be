import { Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from 'app/prisma/prisma.service';
import { ConflictError, NotFoundError } from 'app/common/response';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';
import { Prisma, supplier_status } from '@prisma/client';

@Injectable()
export class SuppliersService {
  private readonly errMsg = {
    ALREADY_SUPPLIER_EMAIL: 'Email nhà cung cấp đã tồn tại!',
    ALREADY_SUPPLIER_CODE: 'Mã nhà cung cấp đã tồn tại!',
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeUseCase: GenerateCodeSupplier,
  ) {}
  async create(createSupplierDto: CreateSupplierDto, storeId: string) {
    await this.checkStore(storeId);
    await this.checkSupplierEmailExists(createSupplierDto.email);
    await this.checkSupplierCodeExists(createSupplierDto.code, storeId);
    const code = await this.codeUseCase.generateCode(storeId);
    return this.prisma.supplier.create({
      data: {
        ...createSupplierDto,
        code: createSupplierDto.code || code,
        store_id: storeId,
      },
    });
  }

  async findAll(query: Prisma.SupplierFindManyArgs, storeId: string) {
    const where: Prisma.SupplierWhereInput = {
      AND: [query.where ?? {}, { store_id: storeId }],
    };

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.supplier.count({
        where,
      }),
    ]);

    return { data: suppliers, total };
  }

  async findOne(id: string, storeId: string) {
    await this.checkStore(storeId);
    return await this.checkSupplier(id, storeId);
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    storeId: string,
  ) {
    await this.checkStore(storeId);
    await this.checkSupplier(id, storeId);
    await this.checkSupplierEmailExists(updateSupplierDto.email, storeId, id);
    await this.checkSupplierCodeExists(updateSupplierDto.code, storeId, id);
    return this.prisma.supplier.update({
      where: { id, store_id: storeId },
      data: updateSupplierDto,
    });
  }

  async remove(id: string, storeId: string) {
    await this.checkStore(storeId);
    await this.checkSupplier(id, storeId);
    return this.prisma.supplier.delete({
      where: { id, store_id: storeId },
    });
  }
  async deleteSoft(id: string, storeId: string) {
    await this.checkStore(storeId);
    await this.checkSupplier(id, storeId);
    return this.prisma.supplier.update({
      where: { id, store_id: storeId },
      data: { status: supplier_status.DELETE, deletedAt: new Date() },
    });
  }
  /**
   * Kiểm tra xem email của nhà cung cấp đã tồn tại hay không.
   * @param email email của nhà cung cấp
   * @returns true nếu không tồn tại, ngược lại throw ConflictError
   */
  private async checkSupplierEmailExists(
    email?: string,
    storeId?: string,
    currentId?: string,
  ) {
    if (email) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { email, store_id: storeId, NOT: { id: currentId } },
      });
      if (supplier) {
        throw new ConflictError(this.errMsg.ALREADY_SUPPLIER_EMAIL);
      }
    }
    return true;
  }

  /**
   * Kiểm tra cửa hàng có tồn tại hay không.
   * @param id mã cửa hàng
   * @returns true nếu tồn tại, ngược lại throw NotFoundError
   */
  private async checkStore(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });
    if (!store) {
      throw new NotFoundError('Cửa hàng không tìm thấy. Vui liệu thử lần sau!');
    }
    return true;
  }

  /**
   * Kiểm tra nhà cung cấp có tồn tại hay không.
   * @param id mã nhà cung cấp
   * @param storeId mã cửa hàng
   * @returns nhà cung cấp nếu tồn tại, ngược lại throw NotFoundError
   */
  private async checkSupplier(id: string, storeId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, store_id: storeId },
      include: { purchase_orders: true },
    });
    if (!supplier) {
      throw new NotFoundError(
        'Nhà cung cấp không tìm thấy. Vui liệu thử lần sau!',
      );
    }
    return supplier;
  }

  /**
   * Kiểm tra mã nhà cung cấp có tồn tại hay không.
   * @param code mã nhà cung cấp
   * @param storeId mã cửa hàng
   * @returns true nếu không tồn tại, ngược lại throw ConflictError
   */
  private async checkSupplierCodeExists(
    code?: string,
    storeId?: string,
    currentId?: string,
  ) {
    if (code) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { code, store_id: storeId, NOT: { id: currentId } },
      });
      if (supplier) {
        throw new ConflictError(this.errMsg.ALREADY_SUPPLIER_CODE);
      }
    }
    return true;
  }
}
