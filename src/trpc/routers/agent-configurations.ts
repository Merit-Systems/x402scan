import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';
import {
  createAgentConfiguration,
  getAgentConfigurationById,
  getAgentConfigurationsByUserId,
  updateAgentConfiguration,
  deleteAgentConfiguration,
} from '@/services/db/agent-config';
import { Visibility } from '@prisma/client';

export const agentConfigurationsRouter = createTRPCRouter({
  // Get all agent configurations for the current user
  getUserConfigurations: protectedProcedure.query(async ({ ctx }) => {
    return await getAgentConfigurationsByUserId(ctx.session.user.id);
  }),

  // Get a specific agent configuration by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const config = await getAgentConfigurationById(input.id);

      // Ensure user owns this configuration
      if (!config || config.userId !== ctx.session.user.id) {
        throw new Error('Configuration not found or access denied');
      }

      return config;
    }),

  // Create a new agent configuration
  create: protectedProcedure
    .input(
      z.object({
        model: z.string().min(1),
        tools: z.array(z.string()),
        systemPrompt: z.string().min(1),
        visibility: z.nativeEnum(Visibility).optional().default('private'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createAgentConfiguration({
        model: input.model,
        tools: input.tools,
        systemPrompt: input.systemPrompt,
        visibility: input.visibility,
        user: {
          connect: { id: ctx.session.user.id },
        },
      });
    }),

  // Update an existing agent configuration
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        model: z.string().min(1).optional(),
        tools: z.array(z.string()).optional(),
        systemPrompt: z.string().min(1).optional(),
        visibility: z.nativeEnum(Visibility).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existingConfig = await getAgentConfigurationById(input.id);
      if (!existingConfig || existingConfig.userId !== ctx.session.user.id) {
        throw new Error('Configuration not found or access denied');
      }

      const updateData: {
        model?: string;
        tools?: string[];
        systemPrompt?: string;
        visibility?: Visibility;
      } = {};
      
      if (input.model !== undefined) updateData.model = input.model;
      if (input.tools !== undefined) updateData.tools = input.tools;
      if (input.systemPrompt !== undefined) updateData.systemPrompt = input.systemPrompt;
      if (input.visibility !== undefined) updateData.visibility = input.visibility;

      return await updateAgentConfiguration(input.id, updateData);
    }),

  // Delete an agent configuration
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existingConfig = await getAgentConfigurationById(input.id);
      if (!existingConfig || existingConfig.userId !== ctx.session.user.id) {
        throw new Error('Configuration not found or access denied');
      }

      return await deleteAgentConfiguration(input.id);
    }),
});

