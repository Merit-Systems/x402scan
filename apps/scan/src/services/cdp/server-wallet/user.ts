import { getWalletForUserId as getWalletForUserIdDb } from '@/services/db/user/server-wallets';

import { wallets } from './wallets';

export const getUserWallets = async (userId: string) => {
  const dbWallet = await getWalletForUserIdDb(userId);
  return {
    wallets: wallets(dbWallet.walletName),
    id: dbWallet.id,
  };
};
