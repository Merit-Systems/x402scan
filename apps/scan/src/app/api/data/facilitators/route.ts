import type { NextRequest } from 'next/server';

import { facilitatorsListQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
  toInternalChain,
} from '@/app/api/data/_lib/utils';
import { listTopFacilitators } from '@/services/transfers/facilitators/list';

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    facilitatorsListQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, chain, timeframe } = parsed.data;

  try {
    const result = await listTopFacilitators(
      {
        timeframe: toInternalTimeframe(timeframe),
        chain: toInternalChain(chain),
        sorting: { id: 'tx_count', desc: true },
      },
      { page, page_size }
    );

    return jsonResponse({
      data: result.items,
      pagination: {
        page: result.page,
        page_size,
        has_next_page: result.hasNextPage,
      },
    });
  } catch (err) {
    console.error('Failed to fetch facilitators:', err);
    return errorResponse('Internal server error', 500);
  }
};
