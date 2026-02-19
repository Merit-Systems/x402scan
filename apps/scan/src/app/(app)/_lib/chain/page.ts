import { parseChain } from './parse';

import { getDataChainCookieServer } from '@/app/(app)/_contexts/chain/cookies/server';

import type { Chain } from '@/types/chain';

export const getChainForPage = async (
  searchParams: Record<string, string | string[] | undefined>
): Promise<Chain | undefined> => {
  const chain = searchParams.chain;
  if (chain) {
    const parsedChain = parseChain(chain);
    if (parsedChain) {
      return parsedChain;
    }
  }
  return await getDataChainCookieServer();
};
