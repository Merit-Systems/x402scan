import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';
import {
  hasUserAcknowledgedComposer,
  upsertUserAcknowledgement,
} from '@/services/db/user/acknowledgements';

export const userAcknowledgementsRouter = createTRPCRouter({
  hasAcknowledged: protectedProcedure.query(async ({ ctx }) => {
    return await hasUserAcknowledgedComposer(ctx.session.user.id);
  }),

  upsert: protectedProcedure.mutation(async ({ ctx }) => {
    return await upsertUserAcknowledgement(ctx.session.user.id);
  }),
});
