import type { CountValue, USDCAmount } from './cdp/numeric-types';
import { formatCurrency } from './utils';

export const convertTokenAmount = (amount: bigint | string, decimals = 6) => {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;

  // Convert to string, then use string manipulation to preserve precision
  const amountStr = amountBigInt.toString();

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

export const formatTokenAmount = (
  amount: bigint | string | USDCAmount,
  decimals = 6
) => {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatCurrency(Number(convertTokenAmount(amountBigInt, decimals)));
};

export const formatCount = (
  count: string | number | CountValue,
  options?: Intl.NumberFormatOptions
): string => {
  const countNumber = typeof count === 'string' ? Number(count) : count;
  return countNumber.toLocaleString(undefined, {
    ...options,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
