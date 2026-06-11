import z from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import {
  getOrigin,
  getOriginMetadata,
  listOrigins,
  listOriginsSchema,
  listOriginsWithResources,
  listOriginsWithResourcesSchema,
  searchOrigins,
  searchOriginsSchema,
} from '@/services/db/resources/origin';
import { scanDb } from '@x402scan/scan-db';
import { TRPCError } from '@trpc/server';

// Per-origin rate limit: 5 requests per 60 seconds
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map<string, number[]>();

function checkRateLimit(originId: string): void {
  const now = Date.now();
  const timestamps = requestLog.get(originId) ?? [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(originId, recent);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
    });
  }
  recent.push(now);
  requestLog.set(originId, recent);
}

export const originsRouter = createTRPCRouter({
  get: publicProcedure.input(z.uuid()).query(async ({ input }) => {
    return await getOrigin(input);
  }),
  getMetadata: publicProcedure.input(z.uuid()).query(async ({ input }) => {
    return await getOriginMetadata(input);
  }),
  list: {
    origins: publicProcedure
      .input(listOriginsSchema)
      .query(async ({ input }) => {
        return await listOrigins(input);
      }),

    withResources: publicProcedure
      .input(listOriginsWithResourcesSchema)
      .query(async ({ input }) => {
        return await listOriginsWithResources(input);
      }),
  },
  search: publicProcedure
    .input(searchOriginsSchema)
    .query(async ({ input }) => {
      return await searchOrigins(input);
    }),
  updateEmail: publicProcedure
    .input(z.object({ originId: z.string().uuid(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      checkRateLimit(input.originId);
      const origin = await scanDb.resourceOrigin.findUnique({
        where: { id: input.originId },
        select: { id: true },
      });
      if (!origin) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Origin not found',
        });
      }
      await scanDb.resourceOrigin.update({
        where: { id: input.originId },
        data: { email: input.email },
      });
      return { success: true };
    }),
});
