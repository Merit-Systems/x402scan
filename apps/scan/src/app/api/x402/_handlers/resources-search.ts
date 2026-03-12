import type { resourcesSearchQuerySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { searchResources } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { z } from 'zod';
import type { SupportedChain } from '@/types/chain';

const SEARCH_MAX_FETCH = 1000;
const validChains = new Set<string>(SUPPORTED_CHAINS);

export async function handleResourcesSearch(
  query: z.infer<typeof resourcesSearchQuerySchema>
) {
  const { page, page_size, q, tags, chains } = query;
  const chainList = chains
    ? (chains.split(',').filter(c => validChains.has(c)) as SupportedChain[])
    : undefined;
  const tagList = tags ? tags.split(',').filter(Boolean) : undefined;
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
    data: sliced.slice(0, page_size).map((item: Record<string, unknown>) => ({
      ...item,
      accepts: item.accepts
        ? serializeAccepts(
            item.accepts as { maxAmountRequired: bigint; network: string }[]
          )
        : item.accepts,
    })),
    pagination: { page, page_size, has_next_page: hasNextPage },
  });
}
