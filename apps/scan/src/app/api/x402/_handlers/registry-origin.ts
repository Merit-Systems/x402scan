import { paginatedResponse } from "@/app/api/x402/_lib/utils";
import { serializeAccepts } from "@/lib/token";
import { getOriginFromUrl } from "@/lib/url";
import { listResourcesWithPagination } from "@/services/db/resources/resource";

import type { z } from "zod";

import type { registryOriginQuerySchema } from "@/app/api/x402/_lib/schemas";

export async function handleRegistryOrigin(
  query: z.infer<typeof registryOriginQuerySchema>
) {
  const { url, page, page_size, chain } = query;
  const origin = getOriginFromUrl(url);
  const result = await listResourcesWithPagination(
    {
      where: {
        origin: { origin },
        accepts: chain ? { some: { network: chain } } : undefined,
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
