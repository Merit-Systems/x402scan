import type { NextRequest } from 'next/server';

import { facilitatorsListQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  paginatedResponse,
  errorResponse,
  asChain,
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
        timeframe: timeframe ?? 0,
        chain: asChain(chain),
        sorting: { id: 'tx_count', desc: true },
      },
      { page, page_size }
    );

    return paginatedResponse(result, page_size);
  } catch (err) {
    console.error('Failed to fetch facilitators:', err);
    return errorResponse('Internal server error', 500);
  }
};
