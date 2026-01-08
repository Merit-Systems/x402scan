import z from 'zod';

type ToPaginatedResponseParams<T> = {
  items: T[];
  page: number;
  page_size: number;
  total_count: number;
};

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

type PaginatedResponse<T> = {
  items: T[];
  hasNextPage: boolean;
  total_count: number;
  total_pages: number;
  page: number;
};

/**
 * "Peek ahead" pagination - no COUNT query needed!
 * Expects items to include page_size + 1 items if there's a next page.
 * Returns page_size items and determines hasNextPage from the extra item.
 */
type ToPeekAheadResponseParams<T> = {
  /** Items fetched with LIMIT page_size + 1 */
  items: T[];
  page: number;
  page_size: number;
};

export const toPeekAheadResponse = <T>({
  items,
  page,
  page_size,
}: ToPeekAheadResponseParams<T>): PeekAheadResponse<T> => {
  const hasNextPage = items.length > page_size;
  return {
    items: items.slice(0, page_size),
    hasNextPage,
    page,
  };
};

type PeekAheadResponse<T> = {
  items: T[];
  hasNextPage: boolean;
  page: number;
};
