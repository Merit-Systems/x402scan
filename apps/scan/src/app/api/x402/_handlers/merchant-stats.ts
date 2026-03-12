import type { merchantStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { parseAddress, jsonResponse, asChain } from '@/app/api/x402/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

import type { z } from 'zod';

export async function handleMerchantStats(
  address: string,
  query: z.infer<typeof merchantStatsQuerySchema>
) {
  const addr = parseAddress(address);
  if (!addr.success) return addr.response;

  const { chain, timeframe } = query;
  const stats = await getOverallStatisticsMV({
    timeframe: timeframe ?? 0,
    chain: asChain(chain),
    recipients: { include: [addr.data] },
  });
  return jsonResponse({ data: stats });
}
