import { formatUnits } from 'viem';

export const tokenStringToNumber = (amount: string, decimals = 6): number => {
  if (!amount) return 0;
  if (amount.includes('.')) {
    const parsed = parseFloat(amount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  try {
    return Number(formatUnits(BigInt(amount), decimals));
  } catch {
    const parsed = parseFloat(amount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
};
