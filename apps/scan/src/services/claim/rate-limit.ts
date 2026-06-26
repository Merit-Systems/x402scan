import { scanDb } from '@x402scan/scan-db';

import { getRedisClient } from '@/lib/redis';

import type { Prisma } from '@x402scan/scan-db';

interface RateLimitBudget {
  max: number;
  windowMs: number;
}

/**
 * Atomic fixed-window counter: INCR the key and, only on first touch, set its
 * TTL — in one server-side execution so the key can never be left without an
 * expiry (the INCR-succeeds-but-PEXPIRE-fails race that would otherwise pin a
 * counter forever). Returns the post-increment count.
 */
const INCR_WITH_TTL = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
`;

/**
 * Fixed-window rate limiter. Uses Redis (INCR + PEXPIRE) when available so the
 * limit is shared across serverless instances; falls back to counting recent
 * `OriginClaimCode` rows in Postgres when Redis is disabled/unreachable. The
 * Postgres fallback only covers the "request a code" budgets (which write rows),
 * so verify-side limits degrade to no-op without Redis — acceptable because the
 * per-code attempt cap still bounds verification.
 */
export async function isWithinRateLimit(
  key: string,
  budget: RateLimitBudget,
  fallback?: () => Promise<boolean>
): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const redisKey = `claim:rl:${key}`;
      const count = (await redis.eval(
        INCR_WITH_TTL,
        1,
        redisKey,
        budget.windowMs
      )) as number;
      return count <= budget.max;
    } catch {
      // Fall through to the DB fallback on any Redis error.
    }
  }
  return fallback ? fallback() : true;
}

/** Count `OriginClaimCode` rows matching `where` created within the window. */
export async function countRecentClaimCodes(
  where: Prisma.OriginClaimCodeWhereInput,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  return scanDb.originClaimCode.count({
    where: { ...where, createdAt: { gte: since } },
  });
}
