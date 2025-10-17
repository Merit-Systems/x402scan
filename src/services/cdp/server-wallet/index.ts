import { USDC_ADDRESS } from '@/lib/utils';
import { convertTokenAmount } from '@/lib/token';
import { CdpClient } from '@coinbase/cdp-sdk';
import { getWalletNameForUserId } from '@/services/db/server-wallets';

const cdpClient = new CdpClient();

export const getWalletForUserId = async (userId: string) => {
  const walletName = await getWalletNameForUserId(userId);
  const wallet = await cdpClient.evm.getOrCreateAccount({
    name: walletName,
  });

  return wallet;
};

export const getUSDCBaseBalanceFromUserId = async (
  userId: string
): Promise<number> => {
  const wallet = await getWalletForUserId(userId);
  const balances = await cdpClient.evm.listTokenBalances({
    address: wallet.address,
    network: 'base',
  });

  const usdcBalance = balances.balances.find(
    balance =>
      balance.token.contractAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()
  );

  if (!usdcBalance) {
    return 0;
  }

  return convertTokenAmount(
    usdcBalance.amount.amount,
    usdcBalance.amount.decimals
  );
};

export const getWalletAddressFromUserId = async (userId: string) => {
  const wallet = await getWalletForUserId(userId);
  return wallet.address;
};

export const exportWalletFromUserId = async (userId: string) => {
  const wallet = await getWalletForUserId(userId);
  return await cdpClient.evm.exportAccount({
    address: wallet.address,
    name: wallet.name,
  });
};
