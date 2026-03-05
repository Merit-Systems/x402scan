import { router, withCors, OPTIONS } from '@/lib/router';
import { walletTransactionsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseAddress,
  paginatedResponse,
  asChain,
} from '@/app/api/data/_lib/utils';
import { listFacilitatorTransfers } from '@/services/transfers/transfers/list';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/wallets/transactions')
    .path('data/wallets/{address}/transactions')
    .paid('0.01')
    .method('GET')
    .query(walletTransactionsQuerySchema)
    .description('Paginated transfers where wallet is sender')
    .handler(async ({ query, request }) => {
      const rawAddress = request.nextUrl.pathname.split('/')[4]!;
      const addr = parseAddress(rawAddress);
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
    })
);
