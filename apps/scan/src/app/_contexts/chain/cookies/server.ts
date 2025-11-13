import { cookies } from 'next/headers';

import { COOKIE_KEYS } from './keys';

import { parseChain } from '@/app/_lib/chain/parse';

import type { Chain } from '@/types/chain';

export const getDataChainCookieServer = async (): Promise<
  Chain | undefined
> => {
  try {
    const cookieStore = await cookies();
    return parseChain(cookieStore.get(COOKIE_KEYS.DATA_CHAIN)?.value);
  } catch (error) {
    console.warn('Failed to read cookies:', error);
    return undefined;
  }
};
