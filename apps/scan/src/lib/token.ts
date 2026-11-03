import { usdc } from './tokens/usdc';
import { formatCurrency } from './utils';

import type { SupportedChain } from '@/types/chain';

export const convertTokenAmount = (amount: bigint, decimals = 6) => {
  // 0 is a legal number of decimals: `tokenSchema.decimals` is
  // `z.int().nonnegative()`, and `getSolanaTokenBalance` forwards whatever the
  // mint reports. With 0 decimals the atomic amount already is the display
  // amount, and the string split below has no fractional digits to take.
  if (decimals <= 0) {
    return Number(amount);
  }

  // Convert to string, then use string manipulation to preserve precision.
  // Padding to `decimals + 1` digits guarantees at least one integer digit, so
  // the same split is correct below and above one whole token
  // (500000 -> 0.5, 1500000 -> 1.5).
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const integerPart = amountStr.slice(0, -decimals);
  const decimalPart = amountStr.slice(-decimals);

  return parseFloat(`${integerPart}.${decimalPart}`);
};

export const formatTokenAmount = (amount: bigint, decimals = 6) => {
  return formatCurrency(convertTokenAmount(amount, decimals));
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
