import { router, withCors, OPTIONS } from '@/lib/router';
import { registryOriginQuerySchema } from '@/app/api/data/_lib/schemas';
import { paginatedResponse } from '@/app/api/data/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';

import type { SupportedChain } from '@/types/chain';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/registry/origin')
    .paid('0.01')
    .method('GET')
    .query(registryOriginQuerySchema)
    .description('List all registered x402 resources for an origin')
    .handler(async ({ query }) => {
      const { url, page, page_size, chain } = query;
      const origin = getOriginFromUrl(url);
      const result = await listResourcesWithPagination(
        {
          where: {
            origin: { origin },
            ...(chain
              ? { accepts: { some: { network: chain as SupportedChain } } }
              : {}),
          },
        },
        { page, page_size }
      );
      return paginatedResponse(
        {
          ...result,
          items: result.items.map((item: Record<string, unknown>) => ({
            ...item,
            accepts: item.accepts
              ? serializeAccepts(
                  item.accepts as { maxAmountRequired: bigint; network: string }[]
                )
              : item.accepts,
          })),
        },
        page_size
      );
    })
);
