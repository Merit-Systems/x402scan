import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantsListQuerySchema } from '@/app/api/data/_lib/schemas';
import { paginatedResponse, asChain } from '@/app/api/data/_lib/utils';
import { listTopSellersMV } from '@/services/transfers/sellers/list-mv';

const SORT_MAP = {
  volume: 'total_amount',
  tx_count: 'tx_count',
  unique_buyers: 'unique_buyers',
} as const;

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/merchants')
    .paid('0.01')
    .method('GET')
    .query(merchantsListQuerySchema)
    .description('Paginated list of merchants (top recipients by volume)')
    .handler(async ({ query }) => {
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
    })
);
