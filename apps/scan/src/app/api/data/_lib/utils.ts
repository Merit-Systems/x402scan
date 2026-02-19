import { NextResponse } from 'next/server';

import { mixedAddressSchema } from '@/lib/schemas';

import type z from 'zod';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';

export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const raw = Object.fromEntries(searchParams);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid query parameters', details: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validate and normalize an address path param.
 * EVM addresses are lowercased (matching DB storage), Solana addresses are preserved.
 */
export function parseAddress(
  address: string
):
  | { success: true; data: MixedAddress }
  | { success: false; response: NextResponse } {
  const result = mixedAddressSchema.safeParse(address);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid address', details: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Format a paginated service result into a standard API response. */
export function paginatedResponse(
  result: { items: unknown[]; page: number; hasNextPage: boolean },
  pageSize: number
): NextResponse {
  return jsonResponse({
    data: result.items,
    pagination: {
      page: result.page,
      page_size: pageSize,
      has_next_page: result.hasNextPage,
    },
  });
}

/**
 * Cast validated chain string to Chain enum.
 * Safe because Zod already validates the value is 'base' | 'solana'.
 */
export function asChain(
  chain: 'base' | 'solana' | undefined
): Chain | undefined {
  return chain as Chain | undefined;
}
