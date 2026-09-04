import { NextResponse } from "next/server";

import { z } from "zod";

import { mixedAddressSchema } from "@/lib/schemas";

import type { MixedAddress } from "@/types/address";
import { Chain } from "@/types/chain";

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
        { error: "Invalid address", details: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

/**
 * The values REST handlers pass to jsonResponse: JSON plus the extra leaf
 * types that appear in service-layer rows before serialization (bigint, Date).
 */
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | Date
  | SerializableValue[]
  | { [key: string]: SerializableValue };

/**
 * Compile-time proof that T carries only values the REST layer can serialize
 * (the SerializableValue domain). Expressed as a mapped conditional rather
 * than the recursive union so interface- and intersection-typed rows, which
 * get no implicit index signature, still check structurally. `unknown` fields
 * pass through unchecked: their contract lives at the boundary that produced
 * them.
 */
export type Serializable<T> = [unknown] extends [T]
  ? unknown
  : T extends string | number | boolean | null | undefined | bigint | Date
    ? T
    : T extends readonly (infer U)[]
      ? readonly Serializable<U>[]
      : T extends object
        ? { [K in keyof T]: Serializable<T[K]> }
        : never;

const bigintSchema = z.bigint();

/**
 * Recursively convert BigInt values to strings so JSON.stringify doesn't throw.
 */
function sanitizeBigInts(value: SerializableValue): SerializableValue {
  const bigintValue = bigintSchema.safeParse(value);
  if (bigintValue.success) return bigintValue.data.toString();
  if (Array.isArray(value)) return value.map(sanitizeBigInts);
  if (value instanceof Date) return value;
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeBigInts(v)])
    );
  }
  return value;
}

export function jsonResponse<T>(
  data: T & Serializable<T>,
  status?: number
): NextResponse;
export function jsonResponse(
  data: SerializableValue,
  status = 200
): NextResponse {
  return NextResponse.json(sanitizeBigInts(data), { status });
}

/** Format a paginated service result into a standard API response. */
export function paginatedResponse<T>(
  result: {
    items: (T & Serializable<T>)[];
    page: number;
    hasNextPage: boolean;
  },
  pageSize: number
): NextResponse;
export function paginatedResponse(
  result: { items: SerializableValue[]; page: number; hasNextPage: boolean },
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
  chain: "base" | "solana" | undefined
): Chain | undefined {
  if (chain === undefined) return undefined;
  return chain === "base" ? Chain.BASE : Chain.SOLANA;
}

/**
 * Extract a dynamic path segment from a router handler's request.
 * The handler's request is a Web Request (not NextRequest), so the
 * pathname comes from request.url. Safe because Next only routes
 * paths that match the route's shape.
 */
export function extractPathSegment(request: Request, index: number): string {
  const segment = new URL(request.url).pathname.split("/")[index];
  if (segment === undefined) {
    throw new Error(`Missing path segment at index ${String(index)}`);
  }
  return segment;
}
