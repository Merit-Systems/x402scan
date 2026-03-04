import { usdc } from './tokens/usdc';
import { formatCurrency } from './utils';

import type { SupportedChain } from '@/types/chain';

export const convertTokenAmount = (amount: bigint, decimals = 6) => {
  // Convert to string, then use string manipulation to preserve precision
  const amountStr = amount.toString();

  if (amountStr.length <= decimals) {
    // Amount is less than 1 token (e.g., 500000 -> 0.5)
    return parseFloat(`0.${amountStr.padStart(decimals, '0')}`);
  } else {
    // Amount is 1+ tokens (e.g., 1500000 -> 1.5)
    const integerPart = amountStr.slice(0, -decimals);
    const decimalPart = amountStr.slice(-decimals);
    return parseFloat(`${integerPart}.${decimalPart}`);
  }
};

export const formatTokenAmount = (amount: bigint, decimals = 6) => {
  return formatCurrency(Number(convertTokenAmount(amount, decimals)));
};

/** Convert BigInt maxAmountRequired to a JSON-safe number on accepts records. */
export const serializeAccepts = <
  T extends { maxAmountRequired: bigint; network: string },
>(
  accepts: T[]
) =>
  accepts.map(a => ({
    ...a,
    maxAmountRequired: convertTokenAmount(
      a.maxAmountRequired,
      usdc(a.network as SupportedChain).decimals
    ),
  }));
