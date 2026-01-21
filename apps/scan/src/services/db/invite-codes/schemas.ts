import z from 'zod';

export const inviteCodeByIdSchema = z.object({
  id: z.uuid(),
});

export type InviteCodeById = z.infer<typeof inviteCodeByIdSchema>;
