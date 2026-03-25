import { NextResponse } from 'next/server';

import { mixedAddressSchema } from '@/lib/schemas';

import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';

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

/**
 * Recursively convert BigInt values to strings so JSON.stringify doesn't throw.
 */
function sanitizeBigInts(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeBigInts);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeBigInts(v),
      ])
    );
  }
  return value;
}

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(sanitizeBigInts(data), { status });
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
  chain: 'base' | 'solana' | 'stellar' | undefined
): Chain | undefined {
  return chain as Chain | undefined;
}
