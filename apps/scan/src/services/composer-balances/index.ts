import 'server-only';

import { getBaseUsdcBalances, getSolanaUsdcBalances } from './scan';
import {
  listAllServerAccounts,
  listAllSolanaServerAccounts,
} from '@/services/cdp/server-wallet/list-accounts';
import { listAllEndUsers } from '@/services/cdp/end-users/list';
import { getOwnersByWalletName } from '@/services/db/composer-balances/owners';

import { Chain } from '@/types/chain';

/**
 * Composer funds live in two generations of CDP wallet:
 *
 * - `server` — CDP server wallets named with the `ServerWallet.walletName`
 *   UUID. We hold the keys, so these can be swept.
 * - `embedded` — CDP end-user (embedded) wallets from the earlier email/OAuth
 *   login. These are non-custodial: the user controls the keys and we can only
 *   ask them to withdraw.
 */
type WalletSource = 'server' | 'embedded';

/**
 * Server wallets are named with the `ServerWallet.walletName` UUID. Anything
 * else in the CDP project (`free-tier`, the invite wallets) is app treasury
 * rather than a user balance, so it is reported separately.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ComposerWalletBalanceRow {
  source: WalletSource;
  /** CDP account name for server wallets, CDP end user id for embedded ones. */
  walletName: string;
  address: string;
  chain: Chain.BASE | Chain.SOLANA;
  usdc: number;
  userId: string | null;
  email: string | null;
  loginAddresses: string[];
}

interface SystemWalletRow {
  name: string;
  address: string;
  chain: Chain.BASE | Chain.SOLANA;
  usdc: number;
}

/**
 * One human can hold balances under several CDP identities — signing in with
 * both email and Google creates two end users — so collapse on email where we
 * have one before counting people.
 */
const personKey = (row: ComposerWalletBalanceRow): string =>
  row.email?.toLowerCase() ?? row.userId ?? `orphan:${row.walletName}`;

interface SourceTotals {
  userCount: number;
  walletCount: number;
  totalUsdc: number;
  withEmail: number;
}

interface ComposerBalancesReport {
  rows: ComposerWalletBalanceRow[];
  systemWallets: SystemWalletRow[];
  totals: {
    /** Distinct people, collapsing the CDP identities that share an email. */
    peopleCount: number;
    /** Distinct CDP identities holding a balance, not distinct wallets. */
    userCount: number;
    walletCount: number;
    totalUsdc: number;
    withEmail: number;
    withLoginAddress: number;
    /** Server wallets whose owning `ServerWallet` row no longer exists. */
    orphaned: number;
  };
  bySource: Record<WalletSource, SourceTotals>;
}

interface CandidateWallet {
  source: WalletSource;
  walletName: string;
  address: string;
  chain: Chain.BASE | Chain.SOLANA;
  /** Present for embedded wallets, which carry their own identity from CDP. */
  email?: string | null;
}

/** CDP server wallets — the current generation, custodied by us. */
const collectServerWallets = async (): Promise<CandidateWallet[]> => {
  const [evm, svm] = await Promise.all([
    listAllServerAccounts(),
    listAllSolanaServerAccounts(),
  ]);

  return [
    ...evm.map(a => ({ chain: Chain.BASE as const, ...a })),
    ...svm.map(a => ({ chain: Chain.SOLANA as const, ...a })),
  ].flatMap(({ name, address, chain }) =>
    name
      ? [{ source: 'server' as const, walletName: name, address, chain }]
      : []
  );
};

/**
 * CDP end-user embedded wallets — the earlier generation. Unlike server
 * wallets these always carry an email, since sign-in was email or OAuth.
 */
const collectEmbeddedWallets = async (): Promise<CandidateWallet[]> => {
  const endUsers = await listAllEndUsers();

  return endUsers.flatMap(user => {
    const email =
      user.authenticationMethods.find(method => method.email)?.email ?? null;

    const evm = [...user.evmAccounts, ...user.evmSmartAccounts].map(
      address => ({ address, chain: Chain.BASE as const })
    );
    const svm = user.solanaAccounts.map(address => ({
      address,
      chain: Chain.SOLANA as const,
    }));

    return [...evm, ...svm].map(({ address, chain }) => ({
      source: 'embedded' as const,
      walletName: user.userId,
      address,
      chain,
      email,
    }));
  });
};

const summarise = (rows: ComposerWalletBalanceRow[]): SourceTotals => ({
  userCount: new Set(rows.map(personKey)).size,
  walletCount: rows.length,
  totalUsdc: rows.reduce((sum, r) => sum + r.usdc, 0),
  withEmail: rows.filter(r => r.email).length,
});

export const getComposerBalancesReport =
  async (): Promise<ComposerBalancesReport> => {
    const [serverWallets, embeddedWallets] = await Promise.all([
      collectServerWallets(),
      collectEmbeddedWallets(),
    ]);
    const candidates = [...serverWallets, ...embeddedWallets];

    const [baseBalances, solanaBalances] = await Promise.all([
      getBaseUsdcBalances(
        candidates.filter(c => c.chain === Chain.BASE).map(c => c.address)
      ),
      getSolanaUsdcBalances(
        candidates.filter(c => c.chain === Chain.SOLANA).map(c => c.address)
      ),
    ]);

    const funded = candidates.flatMap(candidate => {
      const usdc =
        candidate.chain === Chain.BASE
          ? baseBalances.get(candidate.address.toLowerCase())
          : solanaBalances.get(candidate.address);
      return usdc ? [{ ...candidate, usdc }] : [];
    });

    // Only server wallets map back to a local user; embedded wallets carry
    // their identity from CDP itself.
    const owners = await getOwnersByWalletName([
      ...new Set(
        funded
          .filter(w => w.source === 'server' && UUID_RE.test(w.walletName))
          .map(w => w.walletName)
      ),
    ]);

    const rows: ComposerWalletBalanceRow[] = funded
      .filter(w => w.source === 'embedded' || UUID_RE.test(w.walletName))
      .map(wallet => {
        const owner = owners.get(wallet.walletName);
        return {
          source: wallet.source,
          walletName: wallet.walletName,
          address: wallet.address,
          chain: wallet.chain,
          usdc: wallet.usdc,
          userId:
            owner?.userId ??
            (wallet.source === 'embedded' ? wallet.walletName : null),
          email: owner?.email ?? wallet.email ?? null,
          loginAddresses: owner?.loginAddresses ?? [],
        };
      })
      .sort((a, b) => b.usdc - a.usdc);

    const systemWallets: SystemWalletRow[] = funded
      .filter(w => w.source === 'server' && !UUID_RE.test(w.walletName))
      .map(w => ({
        name: w.walletName,
        address: w.address,
        chain: w.chain,
        usdc: w.usdc,
      }))
      .sort((a, b) => b.usdc - a.usdc);

    const serverRows = rows.filter(r => r.source === 'server');
    const embeddedRows = rows.filter(r => r.source === 'embedded');

    return {
      rows,
      systemWallets,
      totals: {
        peopleCount: new Set(rows.map(personKey)).size,
        userCount: new Set(rows.map(r => r.userId ?? `orphan:${r.walletName}`))
          .size,
        walletCount: rows.length,
        totalUsdc: rows.reduce((sum, r) => sum + r.usdc, 0),
        withEmail: rows.filter(r => r.email).length,
        withLoginAddress: rows.filter(r => r.loginAddresses.length > 0).length,
        orphaned: serverRows.filter(r => !r.userId).length,
      },
      bySource: {
        server: summarise(serverRows),
        embedded: summarise(embeddedRows),
      },
    };
  };
