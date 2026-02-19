import type { NextRequest } from 'next/server';

import { resourcesSearchQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
} from '@/app/api/data/_lib/utils';
import { searchResources } from '@/services/db/resources/resource';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';

const SEARCH_MAX_FETCH = 1000;
const validChains = new Set<string>(SUPPORTED_CHAINS);

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    resourcesSearchQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, q, tags, chains } = parsed.data;

  try {
    const chainList = chains
      ? (chains.split(',').filter(c => validChains.has(c)) as SupportedChain[])
      : undefined;
    const tagList = tags ? tags.split(',').filter(Boolean) : undefined;

    // searchResources doesn't support offset, so fetch enough items
    // to cover the requested page plus one for peek-ahead (capped)
    const limit = Math.min((page + 1) * page_size + 1, SEARCH_MAX_FETCH);
    const results = await searchResources({
      search: q,
      limit,
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
