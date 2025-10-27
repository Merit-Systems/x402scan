import { env } from '@/env';
import { cdpClient } from './client';

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
