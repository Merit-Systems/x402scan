import type { NextRequest } from 'next/server';

import { resourcesSearchQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
} from '@/app/api/data/_lib/utils';
import { searchResources } from '@/services/db/resources/resource';

import type { SupportedChain } from '@/types/chain';

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    resourcesSearchQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, q, tags, chains } = parsed.data;

  try {
    const chainList = chains
      ? (chains.split(',').filter(Boolean) as SupportedChain[])
      : undefined;
    const tagList = tags ? tags.split(',').filter(Boolean) : undefined;

    // searchResources doesn't support offset, so fetch enough items
    // to cover the requested page plus one for peek-ahead
    const results = await searchResources({
      search: q,
      limit: (page + 1) * page_size + 1,
      chains: chainList,
      tagIds: tagList,
      showExcluded: false,
      showDeprecated: false,
    });

    const start = page * page_size;
    const sliced = results.slice(start, start + page_size + 1);
    const hasNextPage = sliced.length > page_size;

    return jsonResponse({
      data: sliced.slice(0, page_size),
      pagination: {
        page,
        page_size,
        has_next_page: hasNextPage,
      },
    });
  } catch (err) {
    console.error('Failed to search resources:', err);
    return errorResponse('Internal server error', 500);
  }
};
