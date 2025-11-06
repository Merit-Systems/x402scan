import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { USDC_ADDRESS, ERC20_ABI } from './constants';
import { BalanceCheckResult, Currency } from './types';

export async function checkUSDCBalance(
  address: Address,
  threshold: number
): Promise<BalanceCheckResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL!),
  });

  const balance = await client.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const balanceInUSDC = formatUnits(balance, 6);
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
    transport: http(process.env.BASE_RPC_URL!),
  });

  const balance = await client.getBalance({
    address,
  });

  const balanceInETH = formatUnits(balance, 18);
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
