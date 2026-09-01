import { Chain } from "@/types/chain";
import { SIWE_PROVIDER_ID } from "./siwe/constants";
import { SIWS_PROVIDER_ID } from "./siws/constants";

export const chainToAuthProviderId = {
  [Chain.BASE]: SIWE_PROVIDER_ID,
  [Chain.POLYGON]: SIWE_PROVIDER_ID,
  [Chain.OPTIMISM]: SIWE_PROVIDER_ID,
  [Chain.SOLANA]: SIWS_PROVIDER_ID,
} satisfies Record<Chain, string>;
