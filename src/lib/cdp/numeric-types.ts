import z from 'zod';

export type USDCAmount = string & { readonly _brand: 'USDCAmount' };
export type CountValue = string & { readonly _brand: 'CountValue' };

export const usdcAmountSchema = z.string().transform(v => v as USDCAmount);
export const countValueSchema = z.string().transform(v => v as CountValue);

export const toBigInt = (value: USDCAmount | CountValue): bigint =>
  BigInt(value);
export const countToNumber = (value: CountValue): number => Number(value);
export const usdcToNumber = (value: USDCAmount): number =>
  Number(value) / 1_000_000;
