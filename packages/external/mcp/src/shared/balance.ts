import z from 'zod';

import { getBaseUrl } from '@/shared/utils';
import { safeFetchJson } from '@/shared/neverthrow/fetch';

import type { Address } from 'viem';
import type { GlobalFlags } from '@/types';

interface GetBalanceProps {
  address: Address;
  flags: GlobalFlags;
  surface: string;
}

export const getBalance = async ({
  address,
  flags,
  surface,
}: GetBalanceProps) => {
  const url = `${getBaseUrl(flags.dev)}/api/rpc/balance/${address}`;

  const res = await safeFetchJson(
    surface,
    new Request(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    }),
    z.object({
      chain: z.number(),
      balance: z.number(),
    })
  );

  return res;
};
