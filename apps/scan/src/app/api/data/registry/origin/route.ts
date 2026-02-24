import type { NextRequest } from 'next/server';

import { registryOriginQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  paginatedResponse,
  errorResponse,
} from '@/app/api/data/_lib/utils';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { getOriginFromUrl } from '@/lib/url';

import type { SupportedChain } from '@/types/chain';

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    registryOriginQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { url, page, page_size, chain } = parsed.data;

  const origin = getOriginFromUrl(url);

  try {
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

    return paginatedResponse(result, page_size);
  } catch (err) {
    console.error('Failed to fetch origin resources:', err);
    return errorResponse('Internal server error', 500);
  }
};
