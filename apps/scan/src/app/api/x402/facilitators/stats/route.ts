import { router, withCors, OPTIONS } from '@/lib/router';
import { facilitatorStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleFacilitatorStats } from '@/app/api/x402/_handlers/facilitators-stats';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/facilitators/stats')
    .paid('0.01')
    .method('GET')
    .query(facilitatorStatsQuerySchema)
    .description('Overall high-level facilitator stats')
    .handler(({ query }) => handleFacilitatorStats(query))
);
