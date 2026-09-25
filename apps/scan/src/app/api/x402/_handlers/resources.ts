import { paginatedResponse } from "@/app/api/x402/_lib/utils";
import { serializeAccepts } from "@/lib/token";
import { listResourcesWithPagination } from "@/services/db/resources/resource";

import type { z } from "zod";

import type { resourcesListQuerySchema } from "@/app/api/x402/_lib/schemas";

export async function handleResources(
  query: z.infer<typeof resourcesListQuerySchema>
) {
  const { page, page_size, chain } = query;
  const result = await listResourcesWithPagination(
    {
      where: chain ? { accepts: { some: { network: chain } } } : undefined,
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
