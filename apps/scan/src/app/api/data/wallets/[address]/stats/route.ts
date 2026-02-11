import type { NextRequest } from 'next/server';

import { walletStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  parseAddress,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
} from '@/app/api/data/_lib/utils';
import { getWalletStats } from '@/services/transfers/wallets/stats';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) => {
  const { address: rawAddress } = await params;
  const addr = parseAddress(rawAddress);
  if (!addr.success) return addr.response;

  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    walletStatsQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { chain, timeframe } = parsed.data;

  try {
    const stats = await getWalletStats({
      address: addr.data,
      chain,
      timeframe: toInternalTimeframe(timeframe),
    });

    return jsonResponse({ data: stats });
  } catch (err) {
    console.error('Failed to fetch wallet stats:', err);
    return errorResponse('Internal server error', 500);
  }
};
