import { env } from '@/env';
import { cdpClient } from './client';
import { ETH_ADDRESS, USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';
import { Chain } from '@/types/chain';

export const getFreeTierWallet = async () => {
  const freeTierWalletName = env.FREE_TIER_WALLET_NAME;
  if (!freeTierWalletName) {
    throw new Error('FREE_TIER_WALLET_NAME is not set');
  }
  const wallet = await cdpClient.evm.getOrCreateAccount({
    name: freeTierWalletName,
  });
  return wallet;
};

export const getFreeTierWalletBalances = async () => {
  const wallet = await getFreeTierWallet();

  const balances = await cdpClient.evm.listTokenBalances({
    address: wallet.address,
    network: 'base',
  });

  const usdcBalance = balances.balances.find(
    balance =>
      balance.token.contractAddress.toLowerCase() ===
      USDC_ADDRESS[Chain.BASE].toLowerCase()
  );

  const ethBalance = balances.balances.find(
    balance =>
      balance.token.contractAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()
  );

  return {
    address: wallet.address,
    usdc: usdcBalance
      ? convertTokenAmount(
          usdcBalance.amount.amount,
          usdcBalance.amount.decimals
        )
      : 0,
    eth: ethBalance
      ? convertTokenAmount(ethBalance.amount.amount, ethBalance.amount.decimals)
      : 0,
  };
};
