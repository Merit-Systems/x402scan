import type { NextRequest } from 'next/server';

import { merchantsListQuerySchema } from '@/app/api/data/_lib/schemas';
import {
  parseQueryParams,
  jsonResponse,
  errorResponse,
  toInternalTimeframe,
  toInternalChain,
} from '@/app/api/data/_lib/utils';
import { listTopSellersMV } from '@/services/transfers/sellers/list-mv';

const SORT_MAP = {
  volume: 'total_amount',
  tx_count: 'tx_count',
  unique_buyers: 'unique_buyers',
} as const;

export const GET = async (request: NextRequest) => {
  const parsed = parseQueryParams(
    request.nextUrl.searchParams,
    merchantsListQuerySchema
  );
  if (!parsed.success) return parsed.response;

  const { page, page_size, chain, timeframe, sort_by } = parsed.data;

  try {
    const result = await listTopSellersMV(
      {
        timeframe: toInternalTimeframe(timeframe),
        chain: toInternalChain(chain),
        sorting: {
          id: SORT_MAP[sort_by],
          desc: true,
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
    console.error('Failed to fetch merchants:', err);
    return errorResponse('Internal server error', 500);
  }
};
