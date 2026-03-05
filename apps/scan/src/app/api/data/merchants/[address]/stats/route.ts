import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import { parseAddress, jsonResponse, asChain } from '@/app/api/data/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/merchants/stats')
    .path('data/merchants/{address}/stats')
    .paid('0.01')
    .method('GET')
    .query(merchantStatsQuerySchema)
    .description('Aggregate stats for a merchant')
    .handler(async ({ query, request }) => {
      const rawAddress = request.nextUrl.pathname.split('/')[4]!;
      const addr = parseAddress(rawAddress);
      if (!addr.success) return addr.response;

      const { chain, timeframe } = query;
      const stats = await getOverallStatisticsMV({
        timeframe: timeframe ?? 0,
        chain: asChain(chain),
        recipients: { include: [addr.data] },
      });
      return jsonResponse({ data: stats });
    })
);
