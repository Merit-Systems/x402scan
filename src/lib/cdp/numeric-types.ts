import z from 'zod';

export type USDCAmount = string & { readonly _brand: 'USDCAmount' };
export type CountValue = string & { readonly _brand: 'CountValue' };

export const usdcAmountSchema = z.string().transform(v => v as USDCAmount);
export const countValueSchema = z.string().transform(v => v as CountValue);