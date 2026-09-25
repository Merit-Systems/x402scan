import { base } from "viem/chains";

import { checkUSDCBalance, checkETHBalance } from "./balance-checker";
import { Currency } from "./types";

import type { AddressConfig } from "./types";

export const BALANCE_MONITORS: AddressConfig[] = [
  {
    address: "0xCA9eB08F7e2A162258B9DC9c0A071Aa4E89a2CF9",
    chain: base,
    currency: Currency.USDC,
    threshold: 10,
    enabled: false,
  },
  {
    address: "0x034128338730855a835a4Ab9C16a0fBd27441b0F",
    chain: base,
    currency: Currency.ETH,
    threshold: 0.01,
    enabled: true,
  },
];

export const CURRENCY_TO_BALANCE_CHECKER = {
  [Currency.USDC]: checkUSDCBalance,
  [Currency.ETH]: checkETHBalance,
};
