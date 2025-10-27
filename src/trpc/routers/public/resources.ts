import z from 'zod';

import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';

import {
  getResource,
  getResourceByAddress,
  listResources,
  listResourcesWithPagination,
  searchResources,
  searchResourcesSchema,
} from '@/services/db/resources/resource';

import { prisma } from '@/services/db/client';

import { mixedAddressSchema } from '@/lib/schemas';

import { Methods } from '@/types/x402';

import { registerResource } from '@/lib/resources';
import { TRPCError } from '@trpc/server';
import { listResourceTags, listTags } from '@/services/db/resources/tag';

import type { Prisma } from '@prisma/client';

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
    paginated: paginatedProcedure
      .input(
        z.object({
          where: z.custom<Prisma.ResourcesWhereInput>().optional(),
        })
      )
      .query(async ({ input, ctx: { pagination } }) => {
        return await listResourcesWithPagination(pagination, input.where);
      }),
    byAddress: publicProcedure
      .input(mixedAddressSchema)
      .query(async ({ input }) => {
        return await listResources({
          accepts: {
            some: {
              payTo: input,
            },
          },
        });
      }),
  },
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await prisma.resources.findUnique({
      where: { id: input },
      include: {
        accepts: true,
        origin: true,
        response: true,
      },
    });
  }),
  getResourceByAddress: publicProcedure
    .input(mixedAddressSchema)
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

      for (const method of [Methods.POST, Methods.GET]) {
        // ping resource
        const response = await fetch(
          input.url.replace('{', '').replace('}', ''),
          {
            method,
            headers: input.headers,
            body: input.body ? JSON.stringify(input.body) : undefined,
          }
        );

        // if it doesn't respond with a 402, return error
        if (response.status !== 402) {
          continue;
        }

        const result = await registerResource(
          input.url.toString(),
          await response.json()
        );

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
  tags: {
    list: publicProcedure.query(async () => {
      return await listTags();
    }),

    getByResource: publicProcedure.input(z.uuid()).query(async ({ input }) => {
      return await listResourceTags(input);
    }),
  },
});
