import 'server-only';

import { scanComposerWalletBalances } from './scan';
import { getOwnersByWalletName } from '@/services/db/composer-balances/owners';

import type { Chain } from '@/types/chain';

export interface ComposerWalletBalanceRow {
  walletName: string;
  address: string;
  chain: Chain.BASE | Chain.SOLANA;
  usdc: number;
  userId: string | null;
  email: string | null;
  loginAddresses: string[];
}

export interface ComposerBalancesReport {
  rows: ComposerWalletBalanceRow[];
  systemWallets: {
    name: string;
    address: string;
    chain: Chain.BASE | Chain.SOLANA;
    usdc: number;
  }[];
  totals: {
    /** Distinct users holding a balance, not distinct wallets. */
    userCount: number;
    walletCount: number;
    totalUsdc: number;
    withEmail: number;
    withLoginAddress: number;
    /** Wallets whose owning `ServerWallet` row no longer exists. */
    orphaned: number;
  };
}

export const getComposerBalancesReport =
  async (): Promise<ComposerBalancesReport> => {
    const { userWallets, systemWallets } = await scanComposerWalletBalances();

    const owners = await getOwnersByWalletName([
      ...new Set(userWallets.map(w => w.name)),
    ]);

    const rows: ComposerWalletBalanceRow[] = userWallets
      .map(wallet => {
        const owner = owners.get(wallet.name);
        return {
          walletName: wallet.name,
          address: wallet.address,
          chain: wallet.chain,
          usdc: wallet.usdc,
          userId: owner?.userId ?? null,
          email: owner?.email ?? null,
          loginAddresses: owner?.loginAddresses ?? [],
        };
      })
      .sort((a, b) => b.usdc - a.usdc);

    const distinctUsers = new Set(
      rows.map(r => r.userId ?? `orphan:${r.walletName}`)
    );

    return {
      rows,
      systemWallets: systemWallets
        .map(w => ({
          name: w.name,
          address: w.address,
          chain: w.chain,
          usdc: w.usdc,
        }))
        .sort((a, b) => b.usdc - a.usdc),
      totals: {
        userCount: distinctUsers.size,
        walletCount: rows.length,
        totalUsdc: rows.reduce((sum, r) => sum + r.usdc, 0),
        withEmail: rows.filter(r => r.email).length,
        withLoginAddress: rows.filter(r => r.loginAddresses.length > 0).length,
        orphaned: rows.filter(r => !r.userId).length,
      },
    };
  };
