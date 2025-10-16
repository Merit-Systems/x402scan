import { USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';
import { CdpClient } from '@coinbase/cdp-sdk';
import type { EvmServerAccount } from '@coinbase/cdp-sdk';
import { getOrCreateWalletNameFromUserId } from '@/services/db/wallet-name';

const cdpClient = new CdpClient();

export const getOrCreateWalletFromUserId = async (
  userId: string
): Promise<EvmServerAccount> => {
  const walletName = await getOrCreateWalletNameFromUserId(userId);
  const wallet = await cdpClient.evm.getOrCreateAccount({
    name: walletName,
  });
  return wallet;
};

export const getUSDCBaseBalanceFromUserId = async (
  userId: string
): Promise<number> => {
  const wallet = await getOrCreateWalletFromUserId(userId);
  const balances = await cdpClient.evm.listTokenBalances({
    address: wallet.address,
    network: 'base',
  });
  const usdcBalance = balances.balances.find(
    balance => balance.token.contractAddress === USDC_ADDRESS
  );
  return usdcBalance
    ? convertTokenAmount(usdcBalance.amount.amount, usdcBalance.amount.decimals)
    : 0;
};

export const getWalletAddressFromUserId = async (
  userId: string
): Promise<string> => {
  const wallet = await getOrCreateWalletFromUserId(userId);
  return wallet.address;
};
