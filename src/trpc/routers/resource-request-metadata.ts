import { adminProcedure, createTRPCRouter } from '../trpc';
import {
  createResourceRequestMetadata,
  createResourceRequestMetadataSchema,
  updateResourceRequestMetadata,
  updateResourceRequestMetadataSchema,
  getResourceRequestMetadata,
  getAllResourceRequestMetadata,
  deleteResourceRequestMetadata,
  searchResourcesForMetadata,
} from '@/services/db/resource-request-metadata';
import { z } from 'zod';

export const resourceRequestMetadataRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return await getAllResourceRequestMetadata();
  }),

  getByResource: adminProcedure.input(z.uuid()).query(async ({ input }) => {
    return await getResourceRequestMetadata(input);
  }),

  searchResources: adminProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      return await searchResourcesForMetadata(input.search);
    }),

  create: adminProcedure
    .input(createResourceRequestMetadataSchema)
    .mutation(async ({ input }) => {
      return await createResourceRequestMetadata(input);
    }),

  update: adminProcedure
    .input(updateResourceRequestMetadataSchema)
    .mutation(async ({ input }) => {
      return await updateResourceRequestMetadata(input);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteResourceRequestMetadata(input.id);
    }),
});
