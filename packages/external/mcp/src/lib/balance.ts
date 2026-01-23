import type { Address } from 'viem';
import { getBaseUrl } from './utils';
import { z } from 'zod';

const balanceApiResponseSchema = z.object({
  address: z.string(),
  chain: z.number().int(),
  balance: z.coerce.number(),
  rawBalance: z.string(),
});

interface GetUSDCBalanceProps {
  address: Address;
  dev: boolean;
  network?: string;
}

export async function getUSDCBalance({
  address,
  dev,
}: GetUSDCBalanceProps): Promise<number> {
  const url = `${getBaseUrl(dev)}/api/rpc/balance/${address}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(
      `Balance API request failed (${res.status} ${res.statusText})`
    );
  }

  const result = balanceApiResponseSchema.safeParse(await res.json());
  if (!result.success) {
    throw new Error(
      `Balance API request failed (${res.status} ${res.statusText})`
    );
  }
  return result.data.balance;
}
