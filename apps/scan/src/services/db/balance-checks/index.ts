import { scanDb } from '@x402scan/scan-db';

export const logBalanceCheck = async (wallet: string, chain: string) => {
  return scanDb.balanceCheck.create({
    data: {
      wallet: wallet.toLowerCase(),
      chain,
    },
  });
};

export const getBalanceChecksByWallet = async (wallet: string) => {
  return scanDb.balanceCheck.findMany({
    where: { wallet: wallet.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  });
};

export const getBalanceCheckCountByWallet = async (wallet: string) => {
  return scanDb.balanceCheck.count({
    where: { wallet: wallet.toLowerCase() },
  });
};
