import { router, withCors, OPTIONS } from '@/lib/router';
import { facilitatorsListQuerySchema } from '@/app/api/data/_lib/schemas';
import { paginatedResponse, asChain } from '@/app/api/data/_lib/utils';
import { listTopFacilitators } from '@/services/transfers/facilitators/list';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/facilitators')
    .paid('0.01')
    .method('GET')
    .query(facilitatorsListQuerySchema)
    .description('Paginated list of facilitators with stats')
    .handler(async ({ query }) => {
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
    })
);
