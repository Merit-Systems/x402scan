import z from 'zod';

import { TRPCError } from '@trpc/server';

import { getClientIp } from '@/lib/request-ip';
import { requestClaim } from '@/services/claim/request-claim';

import { createTRPCRouter, publicProcedure } from '../../trpc';

const NO_EMAIL_MESSAGE =
  'No contact email found in this origin’s openapi.json. Add info.contact.email to your spec and re-register to claim it.';

export const claimRouter = createTRPCRouter({
  // Issues a one-time code to the origin's live openapi.json contact email.
  request: publicProcedure
    .input(z.object({ originId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const result = await requestClaim({
        originId: input.originId,
        ip: getClientIp(ctx.headers),
      });

      if (result.ok) {
        return { maskedEmail: result.maskedEmail };
      }

      switch (result.reason) {
        case 'not_found':
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Origin not found',
          });
        case 'no_email':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: NO_EMAIL_MESSAGE,
          });
        case 'rate_limited':
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many claim attempts. Try again later.',
          });
        case 'send_failed':
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Could not send the code. Please try again.',
          });
      }
    }),
});
