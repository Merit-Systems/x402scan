import { formatUnits } from 'viem';

export const tokenStringToNumber = (amount: string, decimals = 6) => {
  return Number(formatUnits(BigInt(amount), decimals));
};
