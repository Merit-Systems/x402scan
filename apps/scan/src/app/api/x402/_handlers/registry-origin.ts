import { registryOriginQuerySchema } from '@/app/api/x402/_lib/schemas';
import { paginatedResponse } from '@/app/api/x402/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { serializeAccepts } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';

import type { z } from 'zod';
import type { SupportedChain } from '@/types/chain';

export async function handleRegistryOrigin(
  query: z.infer<typeof registryOriginQuerySchema>
) {
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
}
