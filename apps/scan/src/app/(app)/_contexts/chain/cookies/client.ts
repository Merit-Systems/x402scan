import { setCookie } from "cookies-next/client";

import { COOKIE_KEYS } from "./keys";

import type { Chain } from "@/types/chain";

export const setDataChainCookieClient = (chain: Chain | undefined): void => {
  setCookie(COOKIE_KEYS.DATA_CHAIN, chain);
};
