import { router, withCors, OPTIONS } from '@/lib/router';
import { facilitatorStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import { jsonResponse, asChain } from '@/app/api/data/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/facilitators/stats')
    .paid('0.01')
    .method('GET')
    .query(facilitatorStatsQuerySchema)
    .description('Overall high-level facilitator stats')
    .handler(async ({ query }) => {
      const { chain, timeframe } = query;
      const stats = await getOverallStatisticsMV({
        timeframe: timeframe ?? 0,
        chain: asChain(chain),
      });
      return jsonResponse({ data: stats });
    })
);
