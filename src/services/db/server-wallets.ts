import { prisma } from './client';

import { v4 as uuid } from 'uuid';

export const getWalletNameForUserId = async (userId: string) => {
  const wallet = await prisma.serverWallet.findFirst({
    where: { userId, type: 'CHAT' },
  });

  if (wallet) {
    return wallet.walletName;
  }

  const newWallet = await prisma.serverWallet.create({
    data: {
      userId,
      walletName: uuid(),
      type: 'CHAT',
    },
  });
  return newWallet.walletName;
};
