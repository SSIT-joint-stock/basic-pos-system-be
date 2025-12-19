import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import {
  FilterParse,
  type FilterParseResult,
} from 'app/common/decorators/filter-parse.decorator';
import z from 'zod';
import { PaginatedResponse } from 'app/common/response';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post(':storeId')
  create(
    @Body() createTagDto: CreateTagDto,
    @Param('storeId') storeId: string,
  ) {
    return this.tagService.create(createTagDto, storeId);
  }

  @Get(':storeId')
  async findAll(
    @FilterParse({
      allowPagination: true,
      allowSorting: true,
      allowGetBetweenDate: true,
      defaultSortBy: 'createdAt',
      defaultSort: 'desc',
      allowedSortBy: ['name', 'createdAt'],
      searchBy: ['name', 'description'],
      searchKey: 'q',
      schema: z.object({
        q: z.string().optional(),
        createdAt: z
          .object({
            gte: z.string().optional(),
            lte: z.string().optional(),
          })
          .optional(),
      }),
    })
    query: FilterParseResult<any>,
    @Param('storeId') storeId: string,
  ) {
    const { tags, total } = await this.tagService.findAll(
      query.prismaQuery,
      storeId,
    );
    return PaginatedResponse.from(tags, query.page, query.limit, total, '');
  }

  @Get(':id/:storeId')
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.tagService.findOne(id, storeId);
  }

  @Patch(':id/:storeId')
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagService.update(id, storeId, updateTagDto);
  }

  @Delete(':id/:storeId')
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.tagService.remove(id, storeId);
  }
}
