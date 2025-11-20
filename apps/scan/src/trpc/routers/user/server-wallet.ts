import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import { getUserWallets } from '@/services/cdp/server-wallet/user';
import { mixedAddressSchema, supportedChainSchema } from '@/lib/schemas';
import z from 'zod';
import {
  getTokenBalanceSchema,
  sendTokensSchema,
} from '@/services/cdp/server-wallet/wallets/schemas';
import { tokenSchema } from '@/types/token';
import { usdc } from '@/lib/tokens/usdc';
import { SUPPORTED_CHAINS } from '@/types/chain';
import { wrapFetchWithPayment } from 'x402-fetch';
import { parseUnits } from 'viem';
import { env } from '@/env';

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

  chainsWithBalances: protectedProcedure.query(async ({ ctx }) => {
    const { wallets } = await getUserWallets(ctx.session.user.id);
    return Promise.all(
      SUPPORTED_CHAINS.map(async chain => ({
        chain,
        balance: await wallets[chain].getTokenBalance({ token: usdc(chain) }),
      }))
    )
      .then(balances => balances.filter(balance => balance.balance > 0))
      .then(balances => balances.map(balance => balance.chain));
  }),

  sendUsdc: protectedProcedure
    .input(
      z.object({
        chain: supportedChainSchema,
        amount: z.number(),
        address: mixedAddressSchema,
      })
    )
    .mutation(async ({ ctx, input: { chain, amount, address } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        await wallets[chain].signer(),
        parseUnits(amount.toString(), usdc(chain).decimals)
      );
      const url = new URL(`/api/send`, env.NEXT_PUBLIC_APP_URL);
      url.searchParams.set('amount', amount.toString());
      url.searchParams.set('address', address);
      url.searchParams.set('chain', chain);
      const response = await fetchWithPayment(url.toString(), {
        method: 'POST',
      });
      return (await response.json()) as { success: boolean; message: string };
    }),
});
