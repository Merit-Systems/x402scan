import { facilitatorsListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { paginatedResponse, asChain } from '@/app/api/x402/_lib/utils';
import { listTopFacilitators } from '@/services/transfers/facilitators/list';

import type { z } from 'zod';

export async function handleFacilitators(
  query: z.infer<typeof facilitatorsListQuerySchema>
) {
  const { page, page_size, chain, timeframe } = query;
  const result = await listTopFacilitators(
    {
      timeframe: timeframe ?? 0,
      chain: asChain(chain),
      sorting: { id: 'tx_count', desc: true },
    },
    { page, page_size }
  );
  return paginatedResponse(result, page_size);
}
