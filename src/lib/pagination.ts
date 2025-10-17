import { z } from 'zod';

import type { PaginatedResponse } from '@/types/pagination';

export const infiniteQuerySchema = <T>(cursorType: z.ZodType<T>) =>
  z.object({
    cursor: cursorType.optional(),
    limit: z.number().optional().default(100),
  });

export const paginatedQuerySchema = () =>
  z.object({
    skip: z.number().optional().default(0),
    limit: z.number().optional().default(100),
  });

interface ToPaginatedResponseParams<T> {
  items: T[];
  limit: number;
}

export const toPaginatedResponse = <T>({
  items,
  limit,
}: ToPaginatedResponseParams<T>): PaginatedResponse<T> => {
  return {
    items: items.slice(0, limit),
    hasNextPage: items.length > limit,
  };
};
