import z from 'zod';

export const requestSchema = z.object({
  url: z.url().describe('The endpoint URL'),
  method: z
    .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    .default('GET')
    .describe('HTTP method'),
  body: z
    .unknown()
    .optional()
    .describe('Request body for POST/PUT/PATCH methods'),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .describe('Additional headers to include')
    .default({}),
});

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
