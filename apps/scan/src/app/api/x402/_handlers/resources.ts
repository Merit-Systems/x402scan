import type { resourcesListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { paginatedResponse } from '@/app/api/x402/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';

import type { z } from 'zod';
import type { SupportedChain } from '@/types/chain';

export async function handleResources(
  query: z.infer<typeof resourcesListQuerySchema>
) {
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
}
