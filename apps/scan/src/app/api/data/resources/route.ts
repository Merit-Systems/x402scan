import { router, withCors, OPTIONS } from '@/lib/router';
import { resourcesListQuerySchema } from '@/app/api/data/_lib/schemas';
import { paginatedResponse } from '@/app/api/data/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';

import type { SupportedChain } from '@/types/chain';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/resources')
    .paid('0.01')
    .method('GET')
    .query(resourcesListQuerySchema)
    .description('Paginated list of all indexed x402 resources')
    .handler(async ({ query }) => {
      const { page, page_size, chain } = query;
      const result = await listResourcesWithPagination(
        {
          where: chain
            ? { accepts: { some: { network: chain as SupportedChain } } }
            : undefined,
        },
        { page, page_size }
      );
      return paginatedResponse(
        {
          ...result,
          items: result.items.map((item: Record<string, unknown>) => ({
            ...item,
            accepts: serializeAccepts(
              item.accepts as { maxAmountRequired: bigint; network: string }[]
            ),
          })),
        },
        page_size
      );
    })
);
