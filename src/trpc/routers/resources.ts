import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import {
  getResourceByAddress,
  listResources,
  searchResources,
  searchResourcesSchema,
} from '@/services/db/resources';
import { registerResource } from '@/services/resources/registration';

import { ethereumAddressSchema } from '@/lib/schemas';

export const resourcesRouter = createTRPCRouter({
  list: {
    all: publicProcedure.query(async () => {
      return await listResources();
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
      // Use shared registration service
      return await registerResource(input);
    }),
});
