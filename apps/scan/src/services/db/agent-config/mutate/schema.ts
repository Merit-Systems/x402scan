import z from 'zod';

export const agentConfigurationSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  image: z.url().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().default(''),
  visibility: z.enum(['public', 'private']).optional().default('private'),
  resourceIds: z.array(z.uuid()).min(1),
  starterPrompts: z.array(z.string()).optional().default([]),
});
