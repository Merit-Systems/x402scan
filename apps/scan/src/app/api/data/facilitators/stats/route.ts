import type { NextRequest } from 'next/server';

import { facilitatorStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
  toInternalChain,
} from '@/app/api/data/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    facilitatorStatsQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { chain, timeframe } = parsed.data;

  try {
    const stats = await getOverallStatisticsMV({
      timeframe: toInternalTimeframe(timeframe),
      chain: toInternalChain(chain),
    });

    return jsonResponse({ data: stats });
  } catch (err) {
    console.error('Failed to fetch facilitator stats:', err);
    return errorResponse('Internal server error', 500);
  }
};
