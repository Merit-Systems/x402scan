import { router, withCors, OPTIONS } from '@/lib/router';
import { facilitatorsListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleFacilitators } from '@/app/api/x402/_handlers/facilitators';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/facilitators')
    .paid('0.01')
    .method('GET')
    .query(facilitatorsListQuerySchema)
    .description('Paginated list of facilitators with stats')
    .handler(({ query }) => handleFacilitators(query))
);
