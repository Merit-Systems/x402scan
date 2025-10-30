import { Prisma } from '@prisma/client';
import z from 'zod';

interface ToPaginatedResponseParams<T> {
  items: T[];
  page: number;
  page_size: number;
  total_count: number;
}

export const paginatedQuerySchema = z.object({
  page: z.number().optional().default(0),
  page_size: z.number().optional().default(10),
});

export type PaginatedQueryParams = z.infer<typeof paginatedQuerySchema>;

export const toPaginatedResponse = <T>({
  items,
  page,
  page_size,
  total_count,
}: ToPaginatedResponseParams<T>): PaginatedResponse<T> => {
  return {
    items: items.slice(0, page_size),
    hasNextPage: page * page_size + page_size < total_count,
    total_count: total_count,
    total_pages: Math.ceil(total_count / page_size),
    page: page,
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  hasNextPage: boolean;
  total_count: number;
  total_pages: number;
  page: number;
};

export const paginationClause = (
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  return Prisma.sql`
    LIMIT ${pagination.page_size} 
    OFFSET ${pagination.page * pagination.page_size}`;
};
