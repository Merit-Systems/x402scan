import { cdpClient } from './client';

export const getWalletAddressFromName = async (walletName: string) => {
  const wallet = await cdpClient.evm.getOrCreateAccount({
    name: walletName,
  });
  return wallet.address;
};
