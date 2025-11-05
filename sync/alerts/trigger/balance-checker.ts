import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

export interface BalanceCheckResult {
  address: Address;
  balance: string; // in USDC (human readable)
  isLow: boolean;
  threshold: number;
}

export async function checkUSDCBalance(
  address: Address,
  threshold: number = 10,
  rpcUrl?: string
): Promise<BalanceCheckResult> {
  // Create public client
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
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
  };
}
