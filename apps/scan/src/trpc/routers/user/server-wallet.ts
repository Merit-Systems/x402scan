import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import { getUserWallets } from '@/services/cdp/server-wallet/user';
import { supportedChainSchema } from '@/lib/schemas';
import z from 'zod';
import {
  getTokenBalanceSchema,
  sendTokensSchema,
} from '@/services/cdp/server-wallet/wallets/schemas';
import { tokenSchema } from '@/types/token';
import { usdc } from '@/lib/tokens/usdc';

const serverWalletChainShape = {
  chain: supportedChainSchema,
};

const serverWalletChainSchema = z.object(serverWalletChainShape);

export const serverWalletRouter = createTRPCRouter({
  address: protectedProcedure
    .input(serverWalletChainSchema)
    .query(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      return await wallets[chain].address();
    }),

  tokenBalance: protectedProcedure
    .input(
      getTokenBalanceSchema
        .omit({ token: true })
        .extend({
          ...serverWalletChainShape,
          token: tokenSchema.optional(),
        })
        .transform(({ token, ...rest }) => {
          return {
            ...rest,
            token: token ?? usdc(rest.chain),
          };
        })
    )
    .query(async ({ ctx, input: { chain, ...rest } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      return await wallets[chain].getTokenBalance(rest);
    }),

  export: protectedProcedure
    .input(serverWalletChainSchema)
    .mutation(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      return await wallets[chain].export();
    }),

  nativeBalance: protectedProcedure
    .input(serverWalletChainSchema)
    .query(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      return await wallets[chain].getNativeTokenBalance();
    }),

  sendTokens: protectedProcedure
    .input(
      sendTokensSchema.extend(serverWalletChainShape).refine(
        ({ chain, token }) => {
          return token.chain === chain;
        },
        {
          error:
            'The token you are sending does not match the chain you are sending on',
        }
      )
    )
    .mutation(async ({ ctx, input: { chain, ...rest } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      return await wallets[chain].sendTokens(rest);
    }),
});
