import { router, withCors, OPTIONS } from '@/lib/router';
import { originResourcesQuerySchema } from '@/app/api/data/_lib/schemas';
import { paginatedResponse } from '@/app/api/data/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';

import type { SupportedChain } from '@/types/chain';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/origins/resources')
    .paid('0.01')
    .method('GET')
    .query(originResourcesQuerySchema)
    .description('Resources for a specific origin/domain')
    .handler(async ({ query, request }) => {
      const id = request.nextUrl.pathname.split('/')[4]!;
      const { page, page_size, chain } = query;
      const result = await listResourcesWithPagination(
        {
          where: {
            originId: id,
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
            accepts: serializeAccepts(
              item.accepts as { maxAmountRequired: bigint; network: string }[]
            ),
          })),
        },
        page_size
      );
    })
);
