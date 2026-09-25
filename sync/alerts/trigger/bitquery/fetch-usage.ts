import type { BitqueryUsageResponse } from "./types";

const USAGE_API_URL = "https://account.bitquery.io/api/usage";
export const USAGE_THRESHOLD = 0.95;

export async function fetchBitqueryUsage(): Promise<BitqueryUsageResponse> {
  const apiKey = process.env.BITQUERY_API_KEY;
  if (!apiKey) {
    throw new Error("BITQUERY_API_KEY is not configured");
  }

  const response = await fetch(USAGE_API_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Bitquery usage API failed: ${response.status} ${body.slice(0, 200)}`
    );
  }

  return response.json() as Promise<BitqueryUsageResponse>;
}

export function isUsageAtThreshold(
  usage: BitqueryUsageResponse,
  threshold = USAGE_THRESHOLD
): boolean {
  const { points_limit } = usage.billing_period.limits;
  const { points_usage } = usage.billing_period.usage;

  if (points_limit === 0) {
    return false;
  }

  return points_usage / points_limit >= threshold;
}
