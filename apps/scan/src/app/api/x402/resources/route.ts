import { router, withCors, OPTIONS } from '@/lib/router';
import { resourcesListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleResources } from '@/app/api/x402/_handlers/resources';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/resources')
    .paid('0.01')
    .method('GET')
    .query(resourcesListQuerySchema)
    .description('Paginated list of all indexed x402 resources')
    .handler(({ query }) => handleResources(query))
);
