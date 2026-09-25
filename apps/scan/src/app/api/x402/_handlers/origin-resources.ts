import type { originResourcesQuerySchema } from "@/app/api/x402/_lib/schemas";
import { paginatedResponse } from "@/app/api/x402/_lib/utils";
import { listResourcesWithPagination } from "@/services/db/resources/resource";
import { serializeAccepts } from "@/lib/token";

import type { z } from "zod";
import type { SupportedChain } from "@/types/chain";

export async function handleOriginResources(
  id: string,
  query: z.infer<typeof originResourcesQuerySchema>
) {
  const { page, page_size, chain } = query;
  const result = await listResourcesWithPagination(
    {
      where: {
        originId: id,
        accepts: chain
          ? { some: { network: chain as SupportedChain } }
          : undefined,
      },
    },
    { page, page_size }
  );
  return paginatedResponse(
    {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        accepts: serializeAccepts(item.accepts),
      })),
    },
    page_size
  );
}
