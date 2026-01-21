import { formatUnits } from 'viem';

export const tokenBigIntToNumber = (amount: bigint, decimals = 6) => {
  return Number(formatUnits(amount, decimals));
};

export const tokenStringToNumber = (amount: string, decimals = 6) => {
  return tokenBigIntToNumber(BigInt(amount), decimals);
};
