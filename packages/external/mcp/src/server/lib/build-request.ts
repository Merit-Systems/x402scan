import type z from 'zod';
import type { requestSchema } from './schemas';

export const buildRequest = (input: z.infer<typeof requestSchema>) => {
  return new Request(input.url, {
    method: input.method,
    body: input.body
      ? typeof input.body === 'string'
        ? input.body
        : JSON.stringify(input.body)
      : undefined,
    headers: {
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
      ...input.headers,
    },
  });
};
