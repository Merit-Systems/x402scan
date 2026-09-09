import { v4 as uuid } from "uuid";

import { scanDb } from "@x402scan/scan-db";

export const getWalletForUserId = async (userId: string) => {
  const wallet = await scanDb.serverWallet.findFirst({
    where: { userId, type: "CHAT" },
  });

  if (wallet) {
    return wallet;
  }

  const newWallet = await scanDb.serverWallet.create({
    data: {
      userId,
      walletName: uuid(),
      type: "CHAT",
    },
  });
  return newWallet;
};
