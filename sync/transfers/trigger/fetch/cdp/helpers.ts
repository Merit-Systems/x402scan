import { generateJwt } from "@coinbase/cdp-sdk/auth";
import { logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { env } from "@/trigger/env";

interface CdpFetchRequest {
  requestMethod: "GET" | "POST" | "PUT" | "DELETE";
  requestPath: string;
  requestHost?: string;
  expiresIn?: number;
}

const DEFAULT_HOST = "api.cdp.coinbase.com";

async function generateCdpJwt(request: CdpFetchRequest): Promise<string> {
  const {
    requestMethod,
    requestHost = DEFAULT_HOST,
    requestPath,
    expiresIn = 120,
  } = request;
  const apiKeyId = env.CDP_API_KEY_ID;
  const apiKeySecret = env.CDP_API_KEY_SECRET;
  if (!apiKeyId || !apiKeySecret) {
    throw new Error("CDP_API_KEY_ID and CDP_API_KEY_SECRET are required");
  }

  return generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod,
    requestPath,
    requestHost,
    expiresIn,
  });
}

export async function cdpFetch(
  request: CdpFetchRequest,
  init?: RequestInit
): Promise<unknown> {
  const { requestMethod, requestPath, requestHost = DEFAULT_HOST } = request;

  const jwt = await generateCdpJwt(request);

  const url = `https://${requestHost}${requestPath}`;

  const response = await fetch(url, {
    ...init,
    method: requestMethod,
    headers: {
      // HeadersInit may be a Headers instance or entry array; normalize before
      // merging — spreading those into an object literal drops/garbles them.
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CDP API error (${String(response.status)}): ${errorText}`);
  }

  return response.json();
}

export async function runCdpSqlQuery<TRow>(
  sql: string,
  rowSchema: z.ZodType<TRow>
): Promise<TRow[]> {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await cdpFetch(
        {
          requestMethod: "POST",
          requestPath: "/platform/v2/data/query/run",
        },
        {
          body: JSON.stringify({ sql }),
        }
      );
      const data = z
        .object({ result: z.array(rowSchema).nullable() })
        .parse(response);

      return data.result ?? [];
    } catch (error) {
      logger.error(
        `[CDP] Error running SQL query: ${error instanceof Error ? error.message : String(error)}`
      );

      const isRateLimit =
        error instanceof Error &&
        (error.message.toLowerCase().includes("rate limit") ||
          error.message.includes("429"));

      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
        logger.warn(`[CDP] Rate limit hit, retrying in ${String(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw error;
      }
    }
  }

  return [];
}
