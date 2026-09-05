import "server-only";

import { erc20Abi, getAddress, isAddress } from "viem";
import { address as toSolanaAddress } from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

import { baseRpc } from "@/services/rpc/base";
import { solanaRpc } from "@/services/rpc/solana";

import { convertTokenAmount } from "@/lib/token";
import { USDC_ADDRESS } from "@/lib/utils";
import { Chain } from "@/types/chain";

import type { Address } from "viem";

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

/**
 * USDC balances for Base addresses, read in multicall batches. A per-account
 * CDP `listTokenBalances` sweep would be thousands of rate limited round
 * trips; this is a handful of RPC calls.
 *
 * Returns only non-zero balances, keyed by lowercased address.
 */
export const getBaseUsdcBalances = async (
  addresses: string[]
): Promise<Map<string, number>> => {
  const unique = [
    ...new Set(addresses.map((address) => address.toLowerCase())),
  ].filter((address): address is Address => isAddress(address));
  const usdcAddress = getAddress(USDC_ADDRESS[Chain.BASE]);
  const balances = new Map<string, number>();

  for (const batch of chunk(unique, EVM_BATCH_SIZE)) {
    const results = await baseRpc.multicall({
      allowFailure: true,
      contracts: batch.map((owner) => ({
        abi: erc20Abi,
        address: usdcAddress,
        functionName: "balanceOf" as const,
        args: [owner],
      })),
    });

    results.forEach((result, index) => {
      const owner = batch[index];
      if (!owner || result.status !== "success") return;
      const usdc = convertTokenAmount(result.result);
      if (usdc > 0) balances.set(owner, usdc);
    });
  }

  return balances;
};

/** SPL token account layout: `amount` is a u64 LE at byte offset 64. */
const AMOUNT_OFFSET = 64;

const readSplAmount = (base64Data: string): bigint => {
  const raw = Buffer.from(base64Data, "base64");
  if (raw.length < AMOUNT_OFFSET + 8) return 0n;
  return raw.readBigUInt64LE(AMOUNT_OFFSET);
};

/**
 * USDC balances for Solana addresses. Reads the associated token accounts
 * directly, so wallets that never held USDC (no ATA on chain) come back null
 * rather than throwing per-account.
 *
 * Returns only non-zero balances, keyed by address.
 */
export const getSolanaUsdcBalances = async (
  addresses: string[]
): Promise<Map<string, number>> => {
  const unique = [...new Set(addresses)];
  const mint = toSolanaAddress(USDC_ADDRESS[Chain.SOLANA]);
  const balances = new Map<string, number>();

  const withAta = await Promise.all(
    unique.map(async (owner) => {
      const [ata] = await findAssociatedTokenPda({
        mint,
        owner: toSolanaAddress(owner),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      return { owner, ata };
    })
  );

  for (const batch of chunk(withAta, SVM_BATCH_SIZE)) {
    const { value } = await solanaRpc
      .getMultipleAccounts(
        batch.map((entry) => entry.ata),
        { encoding: "base64" }
      )
      .send();

    value.forEach((account, index) => {
      const entry = batch[index];
      if (!entry || !account) return;
      const usdc = convertTokenAmount(readSplAmount(account.data[0]));
      if (usdc > 0) balances.set(entry.owner, usdc);
    });
  }

  return balances;
};
