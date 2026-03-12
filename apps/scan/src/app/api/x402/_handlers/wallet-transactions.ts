import type { walletTransactionsQuerySchema } from '@/app/api/x402/_lib/schemas';
import {
  parseAddress,
  paginatedResponse,
  asChain,
} from '@/app/api/x402/_lib/utils';
import { listFacilitatorTransfers } from '@/services/transfers/transfers/list';

import type { z } from 'zod';

export async function handleWalletTransactions(
  address: string,
  query: z.infer<typeof walletTransactionsQuerySchema>
) {
  const addr = parseAddress(address);
  if (!addr.success) return addr.response;

  const { page, page_size, chain, timeframe, sort_by, sort_order } = query;
  const result = await listFacilitatorTransfers(
    {
      timeframe: timeframe ?? 0,
      chain: asChain(chain),
      senders: { include: [addr.data] },
      sorting: {
        id: sort_by === 'time' ? 'block_timestamp' : 'amount',
        desc: sort_order === 'desc',
      },
    },
    { page, page_size }
  );
  return paginatedResponse(result, page_size);
}
