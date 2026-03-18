import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import { Roles } from 'app/common/decorators/roles.decorator';
import { user_role, user_status } from '@prisma/client';
import { z } from 'zod';

const UserFilterSchema = z.object({
  role: z.nativeEnum(user_role).optional(),
  status: z.nativeEnum(user_status).optional(),
  username: z.string().optional(),
  email: z.string().optional(),
});

@Controller('admin/users')
@Roles([user_role.ADMIN])
export class UserAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @FilterParse({
      schema: UserFilterSchema,
      allowPagination: true,
      allowSorting: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['createdAt', 'username', 'email'],
      searchBy: ['username', 'email'],
    })
    filter: FilterParseResult<any>,
  ) {
    return await this.usersService.findAllPaginated(filter.prismaQuery);
  }

  @Get('stats')
  async getStats() {
    return await this.usersService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }
}
