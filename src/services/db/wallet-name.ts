import { prisma } from './client';
import { v4 as uuidv4 } from 'uuid';

export const getOrCreateWalletNameFromUserId = async (
  userId: string
): Promise<string> => {
  const result = await prisma.serverWallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      walletName: uuidv4(),
    },
    select: { walletName: true },
  });

  return result.walletName;
};
