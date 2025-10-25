import { CdpError } from './error';
import { generateCdpJwt } from './generate-jwt';
import { cdpFetchSchema } from './schema';

import type z from 'zod';

export const cdpFetch = async <T>(
  request: z.input<typeof cdpFetchSchema>,
  outputSchema: z.ZodSchema<T>,
  init?: RequestInit
): Promise<T> => {
  const { requestMethod, requestPath, requestHost } =
    cdpFetchSchema.parse(request);

  const jwt = await generateCdpJwt({
    requestMethod: request.requestMethod,
    requestPath: request.requestPath,
    requestHost: request.requestHost,
  });

  const url = `https://${requestHost}${requestPath}`;

  const response = await fetch(url, {
    ...init,
    method: request.requestMethod,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const message = `Failed to ${requestMethod} ${requestPath} from ${requestHost}: ${response.status}`;
    console.error(message);
    throw new CdpError(message, {
      status: response.status,
    });
  }
  return outputSchema.parse(await response.json());
};
