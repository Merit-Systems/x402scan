import { scanDb } from '@x402scan/scan-db';

export const getUserWithAccounts = async (userId: string) => {
  return await scanDb.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
};
