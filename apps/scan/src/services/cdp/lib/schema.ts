import z from 'zod';

export const cdpFetchSchema = z.object({
  requestMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  requestPath: z.string().regex(/^\/[A-Za-z0-9\-._~!$&'()*+,;=:@\/]*$/, {
    message: "requestPath must be a valid path starting with '/'",
  }),
  requestHost: z.string().default('api.cdp.coinbase.com'),
});
