import { TRPCError } from '@trpc/server';

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
import { Chain, SUPPORTED_CHAINS } from '@/types/chain';
import {
  x402Client,
  wrapFetchWithPayment,
  registerExactEvmScheme,
  registerSvmX402Client,
} from '@/lib/x402/wrap-fetch';
import { env } from '@/env';

import type { ClientEvmSigner } from '@/lib/x402/wrap-fetch';
import type { ClientSvmSigner } from '@x402/svm';

const serverWalletChainShape = {
  chain: supportedChainSchema,
};

const serverWalletChainSchema = z.object(serverWalletChainShape);

export const serverWalletRouter = createTRPCRouter({
  address: protectedProcedure
    .input(serverWalletChainSchema)
    .query(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      const result = await wallets[chain].address();
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
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
      const result = await wallets[chain].getTokenBalance(rest);
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),

  export: protectedProcedure
    .input(serverWalletChainSchema)
    .mutation(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      const result = await wallets[chain].export();
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),

  nativeBalance: protectedProcedure
    .input(serverWalletChainSchema)
    .query(async ({ ctx, input: { chain } }) => {
      const { wallets } = await getUserWallets(ctx.session.user.id);
      const result = await wallets[chain].getNativeTokenBalance();
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
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
      const result = await wallets[chain].sendTokens(rest);
      if (result.isErr()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error.message,
        });
      }
      return result.value;
    }),

  chainsWithBalances: protectedProcedure.query(async ({ ctx }) => {
    const { wallets } = await getUserWallets(ctx.session.user.id);
    const balanceResults = await Promise.all(
      SUPPORTED_CHAINS.map(async chain => {
        const result = await wallets[chain].getTokenBalance({
          token: usdc(chain),
        });
        return {
          chain,
          balance: result.isOk() ? result.value : 0,
        };
      })
    );
    return balanceResults
      .filter(balance => balance.balance > 0)
      .map(balance => balance.chain);
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
      const signer = await wallets[chain].signer();

      let client: InstanceType<typeof x402Client>;
      if (chain === Chain.SOLANA) {
        client = registerSvmX402Client({
          signer: signer as ClientSvmSigner,
          rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
        });
      } else {
        client = new x402Client();
        registerExactEvmScheme(client, {
          signer: signer as ClientEvmSigner,
        });
      }

      const fetchWithPayment = wrapFetchWithPayment(fetch, client);
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
