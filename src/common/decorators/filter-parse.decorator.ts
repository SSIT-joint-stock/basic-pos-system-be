import {
  createParamDecorator,
  ExecutionContext,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { z, ZodObject } from 'zod';

//
// 🔹 Default query schema (pagination + sorting)
//
export const DefaultUserQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional(),
});

export type DefaultUserQueryType = z.infer<typeof DefaultUserQuerySchema>;

//
// 🔹 Options type
//
interface FilterParseOptions<TSchema extends ZodObject<any>> {
  schema: TSchema;
  allowPagination?: boolean;
  allowSorting?: boolean;
  allowedSortBy?: string[];
  defaultSortBy: string;
  defaultSort: 'asc' | 'desc';
}

//
// 🔹 Infer filters type from schema
//
export type InferFilters<TSchema extends ZodObject<any>> = z.infer<TSchema>;

//
// 🔹 Return type
//
export interface FilterParseResult<TFilters extends Record<string, any>> {
  page: number;
  limit: number;
  filters: Partial<TFilters>;
  prismaQuery: {
    where: Partial<TFilters>;
    skip: number;
    take: number;
    orderBy: Record<string, 'asc' | 'desc'>;
  };
}

//
// 🔹 Decorator factory
//
export const FilterParse = <TSchema extends ZodObject<any>>(
  options: FilterParseOptions<TSchema>,
) =>
  createParamDecorator(
    (
      data: unknown,
      ctx: ExecutionContext,
    ): FilterParseResult<InferFilters<TSchema>> => {
      const request = ctx.switchToHttp().getRequest<Request>();
      const query = request.query;

      // ✅ Merge default + custom schema
      const finalSchema = DefaultUserQuerySchema.merge(options.schema);

      // ✅ Validate
      const parsed = finalSchema.safeParse(query);
      if (!parsed.success) {
        throw new UnprocessableEntityException(parsed.error.format());
      }

      // ✅ Type of validated query now includes BOTH parts
      const validatedQuery = parsed.data as DefaultUserQueryType &
        InferFilters<TSchema>;

      const result = {} as FilterParseResult<InferFilters<TSchema>>;
      const filters = {} as Partial<InferFilters<TSchema>>;

      //
      // ✅ Pagination
      //
      if (options.allowPagination) {
        const page = parseInt(validatedQuery.page ?? '1', 10);
        const limit = parseInt(validatedQuery.limit ?? '10', 10);
        result.page = isNaN(page) || page < 1 ? 1 : page;
        result.limit = isNaN(limit) || limit < 1 ? 10 : limit;
      } else {
        result.page = 1;
        result.limit = 10;
      }

      //
      // ✅ Extract filters (exclude reserved keys)
      //
      (
        Object.keys(validatedQuery) as Array<keyof typeof validatedQuery>
      ).forEach((key) => {
        if (!['page', 'limit', 'sort', 'sortBy'].includes(key as string)) {
          // now TS knows key is really a key of validatedQuery
          result.filters[key as keyof InferFilters<TSchema>] =
            validatedQuery[key];
        }
      });

      //
      // ✅ Sorting
      //
      const orderBy: Record<string, 'asc' | 'desc'> = {};
      if (options.allowSorting && validatedQuery.sortBy) {
        if (options.allowedSortBy?.includes(validatedQuery.sortBy)) {
          orderBy[validatedQuery.sortBy] =
            validatedQuery.sort ?? options.defaultSort;
        } else {
          throw new UnprocessableEntityException(
            `Invalid sortBy field: ${validatedQuery.sortBy}`,
          );
        }
      } else {
        orderBy[options.defaultSortBy] = options.defaultSort;
      }

      //
      // ✅ Prisma query
      //
      result.prismaQuery = {
        where: filters,
        skip: (result.page - 1) * result.limit,
        take: result.limit,
        orderBy,
      };

      return result;
    },
  )();
