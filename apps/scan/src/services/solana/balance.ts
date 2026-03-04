import z from 'zod';

import { address } from '@solana/kit';

import { solanaRpc } from '@/services/rpc/solana';

import { solanaAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';

import { Chain } from '@/types/chain';

import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

export const getSolanaTokenBalanceSchema = z.object({
  ownerAddress: solanaAddressSchema,
  tokenMint: solanaAddressSchema.default(USDC_ADDRESS[Chain.SOLANA]),
});

export const getSolanaTokenBalance = async (
  input: z.infer<typeof getSolanaTokenBalanceSchema>
) => {
  const { ownerAddress, tokenMint } = getSolanaTokenBalanceSchema.parse(input);

  try {
    const [tokenAccount] = await findAssociatedTokenPda({
      mint: address(tokenMint),
      owner: address(ownerAddress),
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    const {
      value: { amount, decimals },
    } = await solanaRpc.getTokenAccountBalance(tokenAccount).send();

    return convertTokenAmount(BigInt(amount), decimals);
  } catch (error) {
    // Wallets that have never held this token won't have an ATA on-chain.
    // getTokenAccountBalance throws RPC -32602 ("could not find account")
    // which is expected — only log unexpected errors.
    if (!isAccountNotFoundError(error)) {
      console.error('Error getting Solana token balance', error);
    }
    return 0;
  }
};

/** RPC -32602 "could not find account" — the ATA doesn't exist on-chain. */
function isAccountNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error) || !('context' in error)) return false;
  const ctx = (error as { context: Record<string, unknown> }).context;
  return ctx?.__code === -32602;
}

export const getSolanaNativeBalance = async (
  ownerAddress: z.output<typeof solanaAddressSchema>
) => {
  try {
    const balance = await solanaRpc.getBalance(address(ownerAddress)).send();
    return Number(balance.value);
  } catch {
    return 0;
  }
};
