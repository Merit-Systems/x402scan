import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleMerchantStats } from '@/app/api/x402/_handlers/merchant-stats';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/merchants/stats')
    .path('x402/merchants/{address}/stats')
    .paid('0.01')
    .method('GET')
    .query(merchantStatsQuerySchema)
    .description('Aggregate stats for a merchant')
    .handler(({ query, request }) => {
      const address = request.nextUrl.pathname.split('/')[4]!;
      return handleMerchantStats(address, query);
    })
);
