import { randomUUID } from 'crypto';
import type {
  AuditWarning,
  EndpointMethodAdvisory,
} from '@agentcash/discovery';
import { getRedisClient } from '@/lib/redis';

/**
 * Server-side probe session cache.
 *
 * SECURITY: Probe results (advisories) contain merchant-controlled data such as
 * payTo addresses. They must never round-trip through the client — a malicious
 * actor could tamper with them to redirect payments. This cache keeps probe
 * results server-side: the client only receives an opaque sessionId and passes
 * it back at registration time.
 */

const PROBE_SESSION_TTL_SECONDS = 5 * 60; // 5 minutes
const KEY_PREFIX = 'probe-session';

interface CachedProbeResult {
  advisory: EndpointMethodAdvisory;
  warnings: AuditWarning[];
}

function cacheKey(sessionId: string, url: string): string {
  return `${KEY_PREFIX}:${sessionId}:${url}`;
}

export function createProbeSession(): string {
  return randomUUID();
}

export async function cacheProbeResult(
  sessionId: string,
  url: string,
  advisory: EndpointMethodAdvisory,
  warnings: AuditWarning[]
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(
      cacheKey(sessionId, url),
      PROBE_SESSION_TTL_SECONDS,
      JSON.stringify({ advisory, warnings } satisfies CachedProbeResult)
    );
  } catch (err) {
    console.error('[probe-cache] Failed to cache probe result:', err);
  }
}

export async function getCachedProbeResult(
  sessionId: string,
  url: string
): Promise<CachedProbeResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(cacheKey(sessionId, url));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('advisory' in parsed)
    ) {
      return null;
    }
    return parsed as CachedProbeResult;
  } catch (err) {
    console.error('[probe-cache] Failed to read cached probe result:', err);
    return null;
  }
}
