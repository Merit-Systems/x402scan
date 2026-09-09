import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { env } from "@/env";
import { QUERY_CACHE_LIFE } from "@/lib/cache/constants";

/** Wire shape of AgentCash's internal used-origins endpoint. */
const usedOriginsResponseSchema = z.looseObject({
  origins: z.array(z.string()),
});

const PROTOCOL = "x402";
/**
 * Calls AgentCash's internal used-origins endpoint. Returns the ordered list
 * of catalog-used origins for this protocol, ranked by the same trust-weighted
 * score catalog search uses.
 *
 * Returns null on any failure (missing env, non-200, fetch error, malformed
 * payload).
 */
export const fetchUsedOriginsFromAgentCash = async (
  protocol: string
): Promise<string[] | null> => {
  if (!env.AGENTCASH_URL || !env.AGENTCASH_INTERNAL_API_KEY) {
    return null;
  }

  let res: Response;
  try {
    const url = new URL(
      "/api/internal/catalog/used-origins",
      env.AGENTCASH_URL
    );
    url.searchParams.set("protocol", protocol);
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.AGENTCASH_INTERNAL_API_KEY}`,
      },
    });
  } catch (error) {
    console.warn("[discover] AgentCash used-origins fetch failed:", error);
    return null;
  }

  if (!res.ok) {
    console.warn(
      `[discover] AgentCash used-origins returned ${String(res.status)}`
    );
    return null;
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch (error) {
    console.warn(
      "[discover] AgentCash used-origins returned invalid JSON:",
      error
    );
    return null;
  }

  const parsed = usedOriginsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn("[discover] AgentCash used-origins response malformed");
    return null;
  }

  return parsed.data.origins;
};

/** Keep the last successful catalog during transient upstream failures. */
const getCachedDiscoverOrigins = async (): Promise<string[]> => {
  "use cache: remote";
  cacheLife({ ...QUERY_CACHE_LIFE, expire: 86400 });
  cacheTag("discover-origins");

  const origins = await fetchUsedOriginsFromAgentCash(PROTOCOL);
  // Throw within the cached boundary so failed refreshes cannot replace a
  // successful catalog with an empty result. Catch cold failures outside it.
  if (!origins?.length) {
    throw new Error("AgentCash used-origins catalog unavailable or empty");
  }
  return origins;
};

/** Catalog origins in AgentCash ranking order; cold failures degrade to []. */
export const getDiscoverOrigins = async (): Promise<string[]> => {
  try {
    return await getCachedDiscoverOrigins();
  } catch (error) {
    console.warn("[discover] No cached catalog available:", error);
    return [];
  }
};
