import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  joinAgentConfiguration,
  leaveAgentConfiguration,
  listUserAgentConfigurations,
} from '@/services/db/agent-config/user';
import {
  createAgentConfiguration,
  createAgentConfigurationSchema,
  deleteAgentConfiguration,
  updateAgentConfiguration,
  updateAgentConfigurationSchema,
} from '@/services/db/agent-config/mutate';

export const userAgentConfigurationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await listUserAgentConfigurations(ctx.session.user.id);
  }),

  create: protectedProcedure
    .input(createAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return await createAgentConfiguration(ctx.session.user.id, input);
    }),

  update: protectedProcedure
    .input(updateAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateAgentConfiguration(ctx.session.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.uuid())
    .mutation(async ({ input, ctx }) => {
      return await deleteAgentConfiguration(input, ctx.session.user.id);
    }),

  join: protectedProcedure.input(z.uuid()).mutation(async ({ input, ctx }) => {
    return await joinAgentConfiguration(ctx.session.user.id, input);
  }),

  leave: protectedProcedure.input(z.uuid()).mutation(async ({ input, ctx }) => {
    return await leaveAgentConfiguration(ctx.session.user.id, input);
  }),
});
