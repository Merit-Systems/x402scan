import { merchantsListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { paginatedResponse, asChain } from '@/app/api/x402/_lib/utils';
import { listTopSellersMV } from '@/services/transfers/sellers/list-mv';

import type { z } from 'zod';

const SORT_MAP = {
  volume: 'total_amount',
  tx_count: 'tx_count',
  unique_buyers: 'unique_buyers',
} as const;

export async function handleMerchants(
  query: z.infer<typeof merchantsListQuerySchema>
) {
  const { page, page_size, chain, timeframe, sort_by } = query;
  const result = await listTopSellersMV(
    {
      timeframe: timeframe ?? 0,
      chain: asChain(chain),
      sorting: { id: SORT_MAP[sort_by], desc: true },
    },
    { page, page_size }
  );
  return paginatedResponse(result, page_size);
}
