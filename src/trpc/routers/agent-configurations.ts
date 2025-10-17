import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';
import {
  createAgentConfiguration,
  getAgentConfigurationById,
  getAgentConfigurationsByUserId,
  updateAgentConfiguration,
  deleteAgentConfiguration,
  createAgentConfigurationSchema,
  updateAgentConfigurationSchema,
} from '@/services/db/agent-config';

export const agentConfigurationsRouter = createTRPCRouter({
  // Get all agent configurations for the current user
  getUserConfigurations: protectedProcedure.query(async ({ ctx }) => {
    return await getAgentConfigurationsByUserId(ctx.session.user.id);
  }),

  // Get a specific agent configuration by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const config = await getAgentConfigurationById(
        input.id,
        ctx.session.user.id
      );

      // Ensure user owns this configuration
      if (!config || config.ownerId !== ctx.session.user.id) {
        throw new Error('Configuration not found or access denied');
      }

      return config;
    }),

  // Create a new agent configuration
  create: protectedProcedure
    .input(createAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return await createAgentConfiguration(ctx.session.user.id, input);
    }),

  // Update an existing agent configuration
  update: protectedProcedure
    .input(updateAgentConfigurationSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateAgentConfiguration(ctx.session.user.id, input);
    }),

  // Delete an agent configuration
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteAgentConfiguration(input.id, ctx.session.user.id);
    }),
});
