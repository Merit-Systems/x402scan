import { scanDb } from '@x402scan/scan-db';

import { getRedisClient } from '@/lib/redis';

import type { Prisma } from '@x402scan/scan-db';

interface RateLimitBudget {
  max: number;
  windowMs: number;
}

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
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, budget.windowMs);
      }
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
