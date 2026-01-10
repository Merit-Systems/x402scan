import { scanDb } from '@x402scan/scan-db';

export const getUserWithAccounts = async (userId: string) => {
  return await scanDb.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
};

export const getPermiAccountForUser = async (userId: string) => {
  return await scanDb.account.findFirst({
    where: {
      userId,
      provider: 'permi',
    },
  });
};
