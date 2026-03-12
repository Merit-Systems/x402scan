import type { facilitatorStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse, asChain } from '@/app/api/x402/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

import type { z } from 'zod';

export async function handleFacilitatorStats(
  query: z.infer<typeof facilitatorStatsQuerySchema>
) {
  const { chain, timeframe } = query;
  const stats = await getOverallStatisticsMV({
    timeframe: timeframe ?? 0,
    chain: asChain(chain),
  });
  return jsonResponse({ data: stats });
}
