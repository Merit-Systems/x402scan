import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';

// Postgres `bigint` (Prisma BigInt) is signed 64-bit. x402 carries amounts as decimal strings because
// 18-decimal tokens exceed int64 above ~9.22 tokens; such an accept cannot be stored and used to make
// `tx.accepts.upsert` throw, which failed the WHOLE resource (including its storable USDC accept).
const INT64_MAX = BigInt('9223372036854775807');

export const fitsInt64Amount = (amount: string): boolean => {
  if (!/^[0-9]+$/.test(amount)) return false;
  try {
    return BigInt(amount) <= INT64_MAX;
  } catch {
    return false;
  }
};

interface AcceptLike {
  scheme: string;
  network: string;
  maxAmountRequired: string;
}

export type SkippedAccept<T> = {
  accept: T;
  reason:
    | 'unsupported_network'
    | 'amount_exceeds_int64'
    | 'duplicate_scheme_network';
};

/**
 * Accepts that can be stored, in the order the server advertised them.
 * - unsupported networks are skipped (as before);
 * - amounts that do not fit the int64 column are skipped instead of failing the resource;
 * - only the FIRST accept per (scheme, network) is kept: the unique key is
 *   (resourceId, scheme, network), so later ones (e.g. a second token on the same chain) would
 *   otherwise overwrite the server's preferred accept, typically USDC.
 */
export const selectStorableAccepts = <T extends AcceptLike>(
  accepts: T[]
): { storable: T[]; skipped: SkippedAccept<T>[] } => {
  const storable: T[] = [];
  const skipped: SkippedAccept<T>[] = [];
  const seen = new Set<string>();
  for (const accept of accepts) {
    if (!SUPPORTED_CHAINS.includes(accept.network as SupportedChain)) {
      skipped.push({ accept, reason: 'unsupported_network' });
      continue;
    }
    if (!fitsInt64Amount(accept.maxAmountRequired)) {
      skipped.push({ accept, reason: 'amount_exceeds_int64' });
      continue;
    }
    const key = `${accept.scheme}\u0000${accept.network}`;
    if (seen.has(key)) {
      skipped.push({ accept, reason: 'duplicate_scheme_network' });
      continue;
    }
    seen.add(key);
    storable.push(accept);
  }
  return { storable, skipped };
};
