import type { NextRequest } from 'next/server';

import { walletTransactionsQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  parseAddress,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
  toInternalChain,
} from '@/app/api/data/_lib/utils';
import { listFacilitatorTransfers } from '@/services/transfers/transfers/list';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) => {
  const { address: rawAddress } = await params;
  const addr = parseAddress(rawAddress);
  if (!addr.success) return addr.response;

  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    walletTransactionsQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, chain, timeframe, sort_by, sort_order } =
    parsed.data;

  try {
    const result = await listFacilitatorTransfers(
      {
        timeframe: toInternalTimeframe(timeframe),
        chain: toInternalChain(chain),
        senders: { include: [addr.data] },
        sorting: {
          id: sort_by === 'time' ? 'block_timestamp' : 'amount',
          desc: sort_order === 'desc',
        },
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
    console.error('Failed to fetch wallet transactions:', err);
    return errorResponse('Internal server error', 500);
  }
};
