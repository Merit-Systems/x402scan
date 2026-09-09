import { Currency } from "./types";

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const CURRENCY_CONFIG = {
  [Currency.USDC]: { symbol: "$", decimalsExternal: 2, decimalsInternal: 6 },
  [Currency.ETH]: { symbol: "", decimalsExternal: 4, decimalsInternal: 18 },
};

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;
