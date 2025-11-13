import { setCookie, getCookie } from 'cookies-next/client';

import { COOKIE_KEYS } from './keys';

import { parseChain } from '@/app/_lib/chain/parse';

import type { Chain } from '@/types/chain';

export const setDataChainCookieClient = (chain: Chain | undefined): void => {
  setCookie(COOKIE_KEYS.DATA_CHAIN, chain);
};

export const getDataChainCookieClient = () => {
  return parseChain(getCookie(COOKIE_KEYS.DATA_CHAIN));
};
