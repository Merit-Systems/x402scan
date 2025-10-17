import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import {
  getResource,
  getResourceByAddress,
  listResources,
  listResourcesWithPagination,
  searchResources,
  searchResourcesSchema,
} from '@/services/db/resources';

import { ethereumAddressSchema } from '@/lib/schemas';

import { Methods } from '@/types/x402';

import { registerResource } from '@/lib/resources';
import { paginatedQuerySchema } from '@/lib/pagination';
import { TRPCError } from '@trpc/server';

export const resourcesRouter = createTRPCRouter({
  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    const resource = await getResource(input);
    if (!resource) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }
    return resource;
  }),
  list: {
    all: publicProcedure.query(async () => {
      return await listResources();
    }),
    paginated: publicProcedure
      .input(paginatedQuerySchema())
      .query(async ({ input }) => {
        return await listResourcesWithPagination(input);
      }),
    byAddress: publicProcedure
      .input(ethereumAddressSchema)
      .query(async ({ input }) => {
        return await listResources({
          accepts: {
            some: {
              payTo: input.toLowerCase(),
            },
          },
        });
      }),
  },
  getResourceByAddress: publicProcedure
    .input(ethereumAddressSchema)
    .query(async ({ input }) => {
      return await getResourceByAddress(input);
    }),
  search: publicProcedure
    .input(searchResourcesSchema)
    .query(async ({ input }) => {
      return await searchResources(input);
    }),

  register: publicProcedure
    .input(
      z.object({
        url: z.url(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.object().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let parseErrorData: {
        parseErrors: string[];
        data: unknown;
      } | null = null;

      for (const method of [Methods.GET, Methods.POST]) {
        // ping resource
        const response = await fetch(input.url, {
          method,
          headers: input.headers,
          body: input.body ? JSON.stringify(input.body) : undefined,
        });

        // if it doesn't respond with a 402, return error
        if (response.status !== 402) {
          continue;
        }

        const data = (await response.json()) as unknown;

        const result = await registerResource(input.url.toString(), data);

        if (result.success === false) {
          if (result.error.type === 'parseResponse') {
            parseErrorData = {
              data: result.data,
              parseErrors: result.error.parseErrors,
            };
            continue;
          } else {
            return result;
          }
        }

        return result;
      }

      if (parseErrorData) {
        return {
          success: false as const,
          data: parseErrorData.data,
          error: {
            type: 'parseErrors' as const,
            parseErrors: parseErrorData.parseErrors,
          },
        };
      }

      return {
        success: false as const,
        error: {
          type: 'no402' as const,
        },
        type: 'no402' as const,
      };
    }),
});
