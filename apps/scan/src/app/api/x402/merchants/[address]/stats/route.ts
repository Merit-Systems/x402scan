import { router, withCors, OPTIONS } from '@/lib/router';
import { overallStatsResponseSchema } from '@/app/api/x402/_lib/output-schemas';
import { merchantStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { extractPathSegment } from '@/app/api/x402/_lib/utils';
import { handleMerchantStats } from '@/app/api/x402/_handlers/merchant-stats';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/merchants/stats')
    .path('x402/merchants/{address}/stats')
    .paid('0.01')
    .method('GET')
    .query(merchantStatsQuerySchema)
    .output(overallStatsResponseSchema)
    .description('Aggregate stats for a merchant')
    .handler(({ query, request }) => {
      const address = extractPathSegment(request, 4);
      return handleMerchantStats(address, query);
    })
);
