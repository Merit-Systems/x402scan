import z from 'zod';
import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';
import { validateInviteCode, redeemInviteCode } from '@/services/db/invite-codes';
import { mixedAddressSchema } from '@/lib/schemas';

export const inviteRouter = createTRPCRouter({
  validate: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        recipientAddr: mixedAddressSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      return validateInviteCode(input.code, input.recipientAddr);
    }),

  redeem: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        recipientAddr: mixedAddressSchema,
      })
    )
    .mutation(async ({ input }) => {
      return redeemInviteCode({
        code: input.code,
        recipientAddr: input.recipientAddr,
      });
    }),
});
