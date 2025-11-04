import z from 'zod';

import { address, signature } from '@solana/kit';

import { solanaRpc } from './connection';

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
    const [usdcTokenAccount] = await findAssociatedTokenPda({
      mint: address(tokenMint),
      owner: address(ownerAddress),
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    const {
      value: { amount, decimals },
    } = await solanaRpc.getTokenAccountBalance(usdcTokenAccount).send();

    return convertTokenAmount(BigInt(amount), decimals);
  } catch {
    return 0;
  }
};

export const getLatestBlockhash = async () => {
  const { value: latestBlockhash } = await solanaRpc
    .getLatestBlockhash()
    .send();

  return latestBlockhash;
};

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

export const getSolanaTransactionConfirmation = async (sig: string) => {
  const {
    value: [confirmation],
  } = await solanaRpc.getSignatureStatuses([signature(sig)]).send();
  return confirmation;
};
