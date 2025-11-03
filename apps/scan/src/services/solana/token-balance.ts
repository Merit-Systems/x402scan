import { solanaAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import { Chain } from '@/types/chain';
import z from 'zod';
import { solanaRpc } from './connection';
import { Address, address } from '@solana/kit';
import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { env } from '@/env';

export const getSolanaTokenBalanceSchema = z.object({
  ownerAddress: solanaAddressSchema,
  tokenMint: solanaAddressSchema.default(USDC_ADDRESS[Chain.SOLANA]),
});

export const getSolanaTokenBalance = async (
  input: z.infer<typeof getSolanaTokenBalanceSchema>
) => {
  const { ownerAddress, tokenMint } = getSolanaTokenBalanceSchema.parse(input);

  const [usdcTokenAccount] = await findAssociatedTokenPda({
    mint: address(tokenMint),
    owner: address(ownerAddress),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const {
    value: { amount, decimals },
  } = await solanaRpc.getTokenAccountBalance(usdcTokenAccount).send();

  return convertTokenAmount(BigInt(amount), decimals);
};
