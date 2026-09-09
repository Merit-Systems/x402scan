import { z } from "zod";

import {
  createAgentConfiguration,
  createAgentConfigurationSchema,
  deleteAgentConfiguration,
  updateAgentConfiguration,
  updateAgentConfigurationSchema,
} from "@/services/db/agent-config/mutate";
import { listUserAgentConfigurations } from "@/services/db/agent-config/user";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

export const userAgentConfigurationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listUserAgentConfigurations(ctx.session.user.id);
  }),

  create: protectedProcedure
    .input(createAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return createAgentConfiguration(ctx.session.user.id, input);
    }),

  update: protectedProcedure
    .input(updateAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return updateAgentConfiguration(ctx.session.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.uuid())
    .mutation(async ({ input, ctx }) => {
      return deleteAgentConfiguration(input, ctx.session.user.id);
    }),
});
