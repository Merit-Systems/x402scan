import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import { z } from "zod";

import { env } from "@/trigger/env";

import { USDC_ADDRESS, ERC20_ABI, CURRENCY_CONFIG } from "./constants";
import { Currency } from "./types";

import type { Address } from "viem";

import type { BalanceCheckResult } from "./types";

export async function checkUSDCBalance(
  address: Address,
  threshold: number
): Promise<BalanceCheckResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(env.BASE_RPC_URL),
  });

  const balance = await client.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });
  const parsedBalance = z.bigint().parse(balance);

  const balanceInUSDC = formatUnits(
    parsedBalance,
    CURRENCY_CONFIG[Currency.USDC].decimalsInternal
  );
  const balanceNumber = parseFloat(balanceInUSDC);
  const isLow = balanceNumber < threshold;

  return {
    address,
    balance: balanceInUSDC,
    isLow,
    threshold,
    currency: Currency.USDC,
  };
}

export async function checkETHBalance(
  address: Address,
  threshold: number
): Promise<BalanceCheckResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(env.BASE_RPC_URL),
  });

  const balance = await client.getBalance({
    address,
  });

  const balanceInETH = formatUnits(
    balance,
    CURRENCY_CONFIG[Currency.ETH].decimalsInternal
  );
  const balanceNumber = parseFloat(balanceInETH);
  const isLow = balanceNumber < threshold;

  return {
    address,
    balance: balanceInETH,
    isLow,
    threshold,
    currency: Currency.ETH,
  };
}
