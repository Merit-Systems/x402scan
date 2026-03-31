import type { buyersListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { paginatedResponse, asChain } from '@/app/api/x402/_lib/utils';
import { listTopBuyersMV } from '@/services/transfers/buyers/list-mv';

import type { z } from 'zod';

const SORT_MAP = {
  volume: 'total_amount',
  tx_count: 'tx_count',
  unique_sellers: 'unique_sellers',
} as const;

export async function handleBuyers(
  query: z.infer<typeof buyersListQuerySchema>
) {
  const { page, page_size, chain, timeframe, sort_by } = query;
  const result = await listTopBuyersMV(
    {
      timeframe: timeframe ?? 0,
      chain: asChain(chain),
      sorting: { id: SORT_MAP[sort_by], desc: true },
    },
    { page, page_size }
  );
  return paginatedResponse(result, page_size);
}
