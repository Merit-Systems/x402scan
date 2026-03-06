import { router, withCors, OPTIONS } from '@/lib/router';
import { resourcesSearchQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleResourcesSearch } from '@/app/api/x402/_handlers/resources-search';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/resources/search')
    .paid('0.02')
    .method('GET')
    .query(resourcesSearchQuerySchema)
    .description('Full-text search across x402 resources')
    .handler(({ query }) => handleResourcesSearch(query))
);
