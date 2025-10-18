import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BadRequestError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';

@Injectable()
export class CustomerService {
  private readonly errorMessages = {
    //Customer management
    CUSTOMER_NOT_FOUND: 'Customer not found',

    // Store Management
    STORE_NOT_FOUND: 'Store not found',
    STORE_ALREADY_EXISTS: 'Store with this name already exists',

    // General
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Invalid request data',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
  };

  constructor(private readonly prisma: PrismaService) {}

  create(
    store_id: string,
    data: Omit<
      Prisma.CustomerUncheckedCreateInput,
      'id' | 'createdAt' | 'updatedAt' | 'orders' | 'store_id'
    >,
  ) {
    const created = this.prisma.customer.create({
      data: {
        ...data,
        store_id,
      },
    });
    return created;
  }

  async findAll(store_id: string, query: Prisma.CustomerFindManyArgs) {
    const where: Prisma.CustomerWhereInput = {
      AND: [query.where ?? {}, { store_id }],
    };
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy,
      }),
      this.prisma.customer.count({
        where,
      }),
    ]);

    return { data: customers, total };
  }

  async findOne(store_id: string, id: string) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        id,
        store_id,
      },
    });
    if (!existing)
      throw new BadRequestError(this.errorMessages.CUSTOMER_NOT_FOUND);

    return existing;
  }

  async update(
    store_id: string,
    id: string,
    data: Omit<
      Prisma.CustomerUncheckedUpdateInput,
      'id' | 'createdAt' | 'updatedAt' | 'orders' | 'store_id'
    >,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        store_id,
        id,
      },
    });
    if (!existing)
      throw new BadRequestError(this.errorMessages.CUSTOMER_NOT_FOUND);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: data,
    });

    return updated;
  }

  async remove(store_id: string, id: string) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        store_id,
        id,
      },
    });
    if (!existing)
      throw new BadRequestError(this.errorMessages.CUSTOMER_NOT_FOUND);

    await this.prisma.customer.delete({
      where: { id },
    });
  }
}
