import { generateJwt } from '@coinbase/cdp-sdk/auth';
import { logger } from '@trigger.dev/sdk/v3';

interface CdpFetchRequest {
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestPath: string;
  requestHost?: string;
  expiresIn?: number;
}

const DEFAULT_HOST = 'api.cdp.coinbase.com';

async function generateCdpJwt(request: CdpFetchRequest): Promise<string> {
  const {
    requestMethod,
    requestHost = DEFAULT_HOST,
    requestPath,
    expiresIn = 120,
  } = request;

  return await generateJwt({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    requestMethod,
    requestPath,
    requestHost,
    expiresIn,
  });
}

export async function cdpFetch<T>(
  request: CdpFetchRequest,
  init?: RequestInit
): Promise<T> {
  const { requestMethod, requestPath, requestHost = DEFAULT_HOST } = request;

  const jwt = await generateCdpJwt(request);

  const url = `https://${requestHost}${requestPath}`;

  const response = await fetch(url, {
    ...init,
    method: requestMethod,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CDP API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function runCdpSqlQuery(sql: string): Promise<unknown[]> {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const data = await cdpFetch<{ result: unknown[] | null }>(
        {
          requestMethod: 'POST',
          requestPath: '/platform/v2/data/query/run',
        },
        {
          body: JSON.stringify({ sql }),
        }
      );

      return data.result ?? [];
    } catch (error) {
      logger.error(`[CDP] Error running SQL query: ${error}`);

      const isRateLimit =
        error instanceof Error &&
        (error.message.toLowerCase().includes('rate limit') ||
          error.message.includes('429'));

      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
        logger.warn(`[CDP] Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw error;
      }
    }
  }

  return [];
}
