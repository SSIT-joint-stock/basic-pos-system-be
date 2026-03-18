import { Controller, Get, Param } from '@nestjs/common';
import { StoreService } from './store.service';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { Roles } from 'app/common/decorators/roles.decorator';
import { user_role } from '@prisma/client';
import { z } from 'zod';

const StoreFilterSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

@Controller('admin/stores')
@Roles([user_role.ADMIN])
export class StoreAdminController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  async findAll(
    @FilterParse({
      schema: StoreFilterSchema,
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'name', 'city'],
      searchBy: ['name'],
    })
    filter: FilterParseResult<any>,
  ) {
    return await this.storeService.findAllPaginated(filter.prismaQuery);
  }

  @Get('stats')
  async getStats() {
    return await this.storeService.getStoreAdminStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.storeService.findOneAdmin(id);
  }
}
