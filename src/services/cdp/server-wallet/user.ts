import { ETH_ADDRESS, USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';
import { cdpClient } from './client';
import { getWalletForUserId as getWalletForUserIdDb } from '@/services/db/user/server-wallets';
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { ethereumAddressSchema } from '@/lib/schemas';
import z from 'zod';
import { Chain } from '@/types/chain';

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
  const balances = await cdpClient.evm.listTokenBalances({
    address: wallet.wallet.address,
    network: 'base',
  });

  const usdcBalance = balances.balances.find(
    balance =>
      balance.token.contractAddress.toLowerCase() ===
      USDC_ADDRESS[Chain.BASE].toLowerCase()
  );

  if (!usdcBalance) {
    return 0;
  }

  return convertTokenAmount(
    usdcBalance.amount.amount,
    usdcBalance.amount.decimals
  );
};

export const getEthBaseBalanceFromUserId = async (
  userId: string
): Promise<number> => {
  const wallet = await getWalletForUserId(userId);
  const balances = await cdpClient.evm.listTokenBalances({
    address: wallet.wallet.address,
    network: 'base',
  });

  const ethBalance = balances.balances.find(
    balance =>
      balance.token.contractAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()
  );

  if (!ethBalance) {
    return 0;
  }

  return convertTokenAmount(
    ethBalance.amount.amount,
    ethBalance.amount.decimals
  );
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
