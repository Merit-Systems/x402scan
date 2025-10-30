import z from 'zod';

import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import { getOnrampTransactions } from '@/services/cdp/onramp/get-onramp-session';
import {
  createOnrampSession,
  getOnrampSessionByToken,
  updateOnrampSession,
} from '@/services/db/user/onramp-sessions';
import {
  createOnrampUrl,
  createOnrampUrlParamsSchema,
} from '@/services/cdp/onramp/create-onramp-session';

import { SessionStatus } from '@prisma/client';
import { getWalletForUserId } from '@/services/cdp/server-wallet/user';

export const onrampSessionsRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const onrampSession = await getOnrampSessionByToken(
      input,
      ctx.session.user.id
    );

    if (!onrampSession) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    if (onrampSession.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    if (
      onrampSession.status ===
        SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ||
      onrampSession.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
    ) {
      return onrampSession;
    }

    const { transactions } = await getOnrampTransactions(input);

    const transaction = transactions[0];

    if (!transaction) {
      return onrampSession;
    }

    return await updateOnrampSession(onrampSession.id, {
      status: transaction.status,
      txHash: transaction.tx_hash,
      failureReason:
        transaction.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
          ? transaction.failure_reason
          : null,
    });
  }),

  create: protectedProcedure
    .input(createOnrampUrlParamsSchema)
    .mutation(async ({ ctx, input }) => {
      const account = ctx.session.user.accounts.find(
        account => account.type === 'siwe'
      );
      if (!account) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const address = account.providerAccountId;
      const { token, url } = await createOnrampUrl(address, input);
      await createOnrampSession({
        token,
        amount: input.amount,
        userId: ctx.session.user.id,
      });
      return url;
    }),

  serverWallet: {
    create: protectedProcedure
      .input(createOnrampUrlParamsSchema)
      .mutation(async ({ ctx, input }) => {
        const { wallet, id } = await getWalletForUserId(ctx.session.user.id);
        if (!wallet) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const { token, url } = await createOnrampUrl(wallet.address, {
          ...input,
          tokenKey: 'server_wallet_onramp_token',
        });
        await createOnrampSession({
          token,
          amount: input.amount,
          userId: ctx.session.user.id,
          serverWalletId: id,
        });
        return url;
      }),
  },
});
