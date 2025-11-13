import { scanDb } from '../../../../../../packages/internal/databases/scan/src';

import { v4 as uuid } from 'uuid';

export const getWalletForUserId = async (userId: string) => {
  const wallet = await scanDb.serverWallet.findFirst({
    where: { userId, type: 'CHAT' },
  });

  if (wallet) {
    return wallet;
  }

  const newWallet = await scanDb.serverWallet.create({
    data: {
      userId,
      walletName: uuid(),
      type: 'CHAT',
    },
  });
  return newWallet;
};
