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
      const result = await validateInviteCode(input);
      return result.match(
        data =>
          ({
            success: true,
            data,
          }) as const,
        error =>
          ({
            success: false,
            error: error,
          }) as const
      );
    }),

  redeem: publicProcedure
    .input(redeemInviteCodeSchema)
    .mutation(async ({ input }) => {
      const result = await redeemInviteCode(input);
      return result.match(
        data =>
          ({
            success: true,
            data,
          }) as const,
        error =>
          ({
            success: false,
            error: error.message,
          }) as const
      );
    }),
});
