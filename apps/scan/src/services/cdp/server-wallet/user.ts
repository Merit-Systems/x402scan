import { USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';
import { cdpClient } from './client';
import { getWalletForUserId as getWalletForUserIdDb } from '@/services/db/user/server-wallets';
import { encodeFunctionData, erc20Abi, formatEther, parseUnits } from 'viem';
import { ethereumAddressSchema } from '@/lib/schemas';
import z from 'zod';
import { Chain } from '@/types/chain';
import { BASE_USDC } from '@/lib/tokens/usdc';
import { createConfig, getBalance, readContract } from '@wagmi/core';
import { wagmiConfig } from '@/app/_contexts/wagmi/config';
import { base } from 'wagmi/chains';

import type { Address } from 'viem';

export const getWalletForUserId = async (userId: string) => {
  const dbWallet = await getWalletForUserIdDb(userId);
  const wallet = await cdpClient.evm.getOrCreateAccount({
    name: dbWallet.walletName,
  });

  return {
    wallet,
    id: dbWallet.id,
  };
};

export const getUSDCBaseBalanceFromUserId = async (
  userId: string
): Promise<number> => {
  const wallet = await getWalletForUserId(userId);

  const balance = await readContract(createConfig(wagmiConfig), {
    abi: erc20Abi,
    address: BASE_USDC.address as Address,
    args: [wallet.wallet.address],
    functionName: 'balanceOf',
    chainId: base.id,
  });
  return convertTokenAmount(balance, BASE_USDC.decimals);
};

export const getEthBaseBalanceFromUserId = async (
  userId: string
): Promise<number> => {
  const wallet = await getWalletForUserId(userId);
  const weiBalance = await getBalance(createConfig(wagmiConfig), {
    address: wallet.wallet.address,
    chainId: base.id,
  });
  return parseFloat(formatEther(weiBalance.value));
};

export const getWalletAddressFromUserId = async (userId: string) => {
  const wallet = await getWalletForUserId(userId);
  return wallet.wallet.address;
};

export const sendUsdcSchema = z.object({
  amount: z.number(),
  toAddress: ethereumAddressSchema,
});

export const sendServerWalletUSDC = async (
  userId: string,
  input: z.infer<typeof sendUsdcSchema>
) => {
  const wallet = await getWalletForUserId(userId);
  const { amount, toAddress } = input;
  return await wallet.wallet.sendTransaction({
    network: 'base',
    transaction: {
      to: USDC_ADDRESS[Chain.BASE],
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress, parseUnits(amount.toString(), 6)],
      }),
    },
  });
};

export const exportWalletFromUserId = async (userId: string) => {
  const wallet = await getWalletForUserId(userId);
  return await cdpClient.evm.exportAccount({
    address: wallet.wallet.address,
    name: wallet.wallet.name,
  });
};
