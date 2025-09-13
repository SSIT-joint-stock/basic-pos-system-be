import {
  createParamDecorator,
  ExecutionContext,
  UnprocessableEntityException,
} from '@nestjs/common';
import dayjs from 'dayjs';
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type DefaultUserQueryType = z.infer<typeof DefaultUserQuerySchema>;

//
// 🔹 Options type
//
interface FilterParseOptions<TSchema extends ZodObject<any>> {
  schema: TSchema;
  allowGetBetweenDate?: boolean;
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

// DateFilter Format

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

      console.log(validatedQuery);
      const result = {} as FilterParseResult<InferFilters<TSchema>>;
      const filters = {} as Partial<InferFilters<TSchema>> & {
        createdAt?: { gte?: Date; lte?: Date };
      };

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
        if (
          !['page', 'limit', 'sort', 'sortBy', 'startDate', 'endDate'].includes(
            key as string,
          )
        ) {
          {
            filters[key as keyof InferFilters<TSchema>] = validatedQuery[key];
          }
        }
      });

      if (options.allowGetBetweenDate) {
        filters.createdAt = {
          gte: validatedQuery.startDate
            ? dayjs(validatedQuery.startDate).toDate()
            : undefined,
          lte: validatedQuery.endDate
            ? dayjs(validatedQuery.endDate).endOf('day').toDate()
            : undefined,
        };
      }

      result.filters = filters;

      //
      // Get Between Date
      //

      // if (options.allowGetBetweenDate) {
      //   filters['createdAt' as keyof (InferFilters<TSchema> & DateFilter)] = {
      //     gte: validatedQuery.startDate
      //       ? new Date(validatedQuery.startDate)
      //       : undefined,
      //     lte: validatedQuery.endDate
      //       ? new Date(validatedQuery.endDate)
      //       : undefined,
      //   } as any; // cast here to avoid index signature noise
      // }

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
      console.log(result);
      return result;
    },
  )();
