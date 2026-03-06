import { router, withCors, OPTIONS } from '@/lib/router';
import { originResourcesQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleOriginResources } from '@/app/api/x402/_handlers/origin-resources';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/origins/resources')
    .path('x402/origins/{id}/resources')
    .paid('0.01')
    .method('GET')
    .query(originResourcesQuerySchema)
    .description('Resources for a specific origin/domain')
    .handler(({ query, request }) => {
      const id = request.nextUrl.pathname.split('/')[4]!;
      return handleOriginResources(id, query);
    })
);
