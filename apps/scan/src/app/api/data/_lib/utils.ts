import { NextResponse } from 'next/server';

import { Chain } from '@/types/chain';
import { mixedAddressSchema } from '@/lib/schemas';

import type z from 'zod';
import type { MixedAddress } from '@/types/address';

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

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Map API timeframe param (days) to internal timeframe format */
export function toInternalTimeframe(
  timeframe?: number
): number | { period: number } {
  if (timeframe === undefined) return 0;
  return timeframe;
}

/** Map API chain param to internal Chain enum value */
export function toInternalChain(chain?: 'base' | 'solana'): Chain | undefined {
  if (!chain) return undefined;
  return chain === 'base' ? Chain.BASE : Chain.SOLANA;
}

/**
 * Validate and normalize an address path param.
 * EVM addresses are lowercased (matching DB storage), Solana addresses are preserved.
 * Returns 400 response on invalid address.
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
