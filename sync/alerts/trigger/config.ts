import { AddressConfig, Currency } from './types';
import { checkUSDCBalance, checkETHBalance } from './balance-checker';
import { base } from 'viem/chains';

export const BALANCE_MONITORS: AddressConfig[] = [
  {
    address: '0xCA9eB08F7e2A162258B9DC9c0A071Aa4E89a2CF9',
    chain: base,
    currency: Currency.USDC,
    threshold: 10,
  },
  {
    address: '0x034128338730855a835a4Ab9C16a0fBd27441b0F',
    chain: base,
    currency: Currency.ETH,
    threshold: 0.01,
  },
];

export const CURRENCY_TO_BALANCE_CHECKER = {
  [Currency.USDC]: checkUSDCBalance,
  [Currency.ETH]: checkETHBalance,
};

export const CURRENCY_CONFIG = {
  [Currency.USDC]: { symbol: '$', decimalsExternal: 2, decimalsInternal: 6 },
  [Currency.ETH]: { symbol: '', decimalsExternal: 4, decimalsInternal: 18 },
};
