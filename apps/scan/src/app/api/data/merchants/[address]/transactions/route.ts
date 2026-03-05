import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantTransactionsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseAddress,
  paginatedResponse,
  asChain,
} from '@/app/api/data/_lib/utils';
import { listFacilitatorTransfers } from '@/services/transfers/transfers/list';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/merchants/transactions')
    .path('data/merchants/{address}/transactions')
    .paid('0.01')
    .method('GET')
    .query(merchantTransactionsQuerySchema)
    .description('Paginated transfers where merchant is recipient')
    .handler(async ({ query, request }) => {
      const rawAddress = request.nextUrl.pathname.split('/')[4]!;
      const addr = parseAddress(rawAddress);
      if (!addr.success) return addr.response;

      const { page, page_size, chain, timeframe, sort_by, sort_order } = query;
      const result = await listFacilitatorTransfers(
        {
          timeframe: timeframe ?? 0,
          chain: asChain(chain),
          recipients: { include: [addr.data] },
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
