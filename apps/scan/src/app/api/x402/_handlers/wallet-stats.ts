import { walletStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { parseAddress, jsonResponse } from '@/app/api/x402/_lib/utils';
import { getWalletStats } from '@/services/transfers/wallets/stats';

import type { z } from 'zod';

export async function handleWalletStats(
  address: string,
  query: z.infer<typeof walletStatsQuerySchema>
) {
  const addr = parseAddress(address);
  if (!addr.success) return addr.response;

  const { chain, timeframe } = query;
  const stats = await getWalletStats({
    address: addr.data,
    chain,
    timeframe: timeframe ?? 0,
  });
  return jsonResponse({ data: stats });
}
