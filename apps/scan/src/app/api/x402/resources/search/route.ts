import { router, withCors, OPTIONS } from '@/lib/router';
import { resourcesResponseSchema } from '@/app/api/x402/_lib/output-schemas';
import { resourcesSearchQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleResourcesSearch } from '@/app/api/x402/_handlers/resources-search';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/resources/search')
    .paid('0.02')
    .method('GET')
    .query(resourcesSearchQuerySchema)
    .output(resourcesResponseSchema)
    .description('Full-text search across x402 resources')
    .handler(({ query }) => handleResourcesSearch(query))
);
