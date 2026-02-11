import type { NextRequest } from 'next/server';

import { merchantStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  parseAddress,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
  toInternalChain,
} from '@/app/api/data/_lib/utils';
import { getOverallStatisticsMV } from '@/services/transfers/stats/overall-mv';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) => {
  const { address: rawAddress } = await params;
  const addr = parseAddress(rawAddress);
  if (!addr.success) return addr.response;

  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    merchantStatsQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { chain, timeframe } = parsed.data;

  try {
    const stats = await getOverallStatisticsMV({
      timeframe: toInternalTimeframe(timeframe),
      chain: toInternalChain(chain),
      recipients: { include: [addr.data] },
    });

    return jsonResponse({ data: stats });
  } catch (err) {
    console.error('Failed to fetch merchant stats:', err);
    return errorResponse('Internal server error', 500);
  }
};
