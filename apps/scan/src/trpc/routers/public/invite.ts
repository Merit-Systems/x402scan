import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';
import {
  validateInviteCode,
  redeemInviteCode,
  redeemInviteCodeSchema,
  validateInviteCodeSchema,
} from '@/services/db/invite-codes';

export const inviteRouter = createTRPCRouter({
  validate: publicProcedure
    .input(validateInviteCodeSchema)
    .query(async ({ input }) => {
      return validateInviteCode(input);
    }),

  redeem: publicProcedure
    .input(redeemInviteCodeSchema)
    .mutation(async ({ input }) => {
      const result = await redeemInviteCode(input);
      return result.match(
        data => ({
          success: true as const,
          data,
        }),
        error => ({
          success: false as const,
          error: error.message,
        })
      );
    }),
});
