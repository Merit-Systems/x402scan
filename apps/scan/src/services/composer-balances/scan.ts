import 'server-only';

import { erc20Abi } from 'viem';
import { address as toSolanaAddress } from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

import {
  listAllServerAccounts,
  listAllSolanaServerAccounts,
} from '@/services/cdp/server-wallet/list-accounts';
import { baseRpc } from '@/services/rpc/base';
import { solanaRpc } from '@/services/rpc/solana';

import { convertTokenAmount } from '@/lib/token';
import { USDC_ADDRESS } from '@/lib/utils';
import { Chain } from '@/types/chain';

import type { Address } from 'viem';

/**
 * Composer server wallets are named with the `ServerWallet.walletName` UUID.
 * Anything else in the CDP project (`sponsored`, the invite wallets) is app
 * treasury rather than a user balance, so it is reported separately.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Multicall3 handles far larger batches, but this keeps single payloads sane. */
const EVM_BATCH_SIZE = 500;
/** `getMultipleAccounts` is capped at 100 addresses per request. */
const SVM_BATCH_SIZE = 100;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

export interface WalletBalance {
  /** CDP account name — the `ServerWallet.walletName` for user wallets. */
  name: string;
  address: string;
  chain: Chain.BASE | Chain.SOLANA;
  usdc: number;
}

/**
 * USDC balances for every Base composer wallet, read in multicall batches.
 * A per-account CDP `listTokenBalances` sweep would be thousands of rate
 * limited round trips; this is a handful of RPC calls.
 */
const scanBaseBalances = async (): Promise<WalletBalance[]> => {
  const accounts = (await listAllServerAccounts()).filter(a => a.name);
  const usdcAddress = USDC_ADDRESS[Chain.BASE] as Address;

  const balances: WalletBalance[] = [];

  for (const batch of chunk(accounts, EVM_BATCH_SIZE)) {
    const results = await baseRpc.multicall({
      allowFailure: true,
      contracts: batch.map(account => ({
        abi: erc20Abi,
        address: usdcAddress,
        functionName: 'balanceOf' as const,
        args: [account.address as Address],
      })),
    });

    results.forEach((result, index) => {
      const account = batch[index];
      if (!account?.name || result.status !== 'success') return;
      const usdc = convertTokenAmount(result.result);
      if (usdc > 0) {
        balances.push({
          name: account.name,
          address: account.address,
          chain: Chain.BASE,
          usdc,
        });
      }
    });
  }

  return balances;
};

/** SPL token account layout: `amount` is a u64 LE at byte offset 64. */
const AMOUNT_OFFSET = 64;

const readSplAmount = (base64Data: string): bigint => {
  const raw = Buffer.from(base64Data, 'base64');
  if (raw.length < AMOUNT_OFFSET + 8) return 0n;
  return raw.readBigUInt64LE(AMOUNT_OFFSET);
};

/**
 * USDC balances for every Solana composer wallet. Reads the associated token
 * accounts directly so wallets that never held USDC (no ATA on chain) simply
 * come back null instead of throwing per-account.
 */
const scanSolanaBalances = async (): Promise<WalletBalance[]> => {
  const accounts = (await listAllSolanaServerAccounts()).filter(a => a.name);
  const mint = toSolanaAddress(USDC_ADDRESS[Chain.SOLANA]);

  const withAta = await Promise.all(
    accounts.map(async account => {
      const [ata] = await findAssociatedTokenPda({
        mint,
        owner: toSolanaAddress(account.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      return { account, ata };
    })
  );

  const balances: WalletBalance[] = [];

  for (const batch of chunk(withAta, SVM_BATCH_SIZE)) {
    const { value } = await solanaRpc
      .getMultipleAccounts(
        batch.map(entry => entry.ata),
        { encoding: 'base64' }
      )
      .send();

    value.forEach((account, index) => {
      const entry = batch[index];
      if (!entry?.account.name || !account) return;
      const usdc = convertTokenAmount(readSplAmount(account.data[0]));
      if (usdc > 0) {
        balances.push({
          name: entry.account.name,
          address: entry.account.address,
          chain: Chain.SOLANA,
          usdc,
        });
      }
    });
  }

  return balances;
};

export const scanComposerWalletBalances = async () => {
  const [base, solana] = await Promise.all([
    scanBaseBalances(),
    scanSolanaBalances(),
  ]);

  const all = [...base, ...solana];

  return {
    userWallets: all.filter(b => UUID_RE.test(b.name)),
    systemWallets: all.filter(b => !UUID_RE.test(b.name)),
  };
};
