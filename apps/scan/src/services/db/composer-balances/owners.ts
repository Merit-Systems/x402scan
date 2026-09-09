import { scanDb } from "@x402scan/scan-db";

interface WalletOwner {
  userId: string;
  email: string | null;
  /**
   * The address the user signed in with (SIWE/SIWS). Almost all composer users
   * authenticated by wallet rather than email, so this is usually the only
   * identity we hold — and the address funds would be returned to.
   */
  loginAddresses: string[];
}

/**
 * Resolve `ServerWallet.walletName` -> owning user, for the handful of wallets
 * that actually hold a balance. Keyed by wallet name.
 */
export const getOwnersByWalletName = async (
  walletNames: string[]
): Promise<Map<string, WalletOwner>> => {
  if (walletNames.length === 0) return new Map();

  const wallets = await scanDb.serverWallet.findMany({
    where: { walletName: { in: walletNames } },
    select: {
      walletName: true,
      user: {
        select: {
          id: true,
          email: true,
          accounts: { select: { providerAccountId: true } },
        },
      },
    },
  });

  return new Map(
    wallets.map((wallet) => [
      wallet.walletName,
      {
        userId: wallet.user.id,
        email: wallet.user.email,
        loginAddresses: wallet.user.accounts.map((a) => a.providerAccountId),
      },
    ])
  );
};
