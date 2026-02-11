import type { NextRequest } from 'next/server';

import { resourcesListQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
} from '@/app/api/data/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';

import type { SupportedChain } from '@/types/chain';

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    resourcesListQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, chain } = parsed.data;

  try {
    const result = await listResourcesWithPagination(
      {
        where: chain
          ? { accepts: { some: { network: chain as SupportedChain } } }
          : undefined,
      },
      { page, page_size }
    );

    return jsonResponse({
      data: result.items,
      pagination: {
        page: result.page,
        page_size,
        has_next_page: result.hasNextPage,
      },
    });
  } catch (err) {
    console.error('Failed to fetch resources:', err);
    return errorResponse('Internal server error', 500);
  }
};
