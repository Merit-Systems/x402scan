import type { Address } from 'viem';
import { getBaseUrl } from './utils';
import { z } from 'zod';
import type { GlobalFlags } from '@/types';

const balanceApiResponseSchema = z.object({
  address: z.string(),
  chain: z.number().int(),
  balance: z.coerce.number(),
  rawBalance: z.string(),
});

export async function getUSDCBalance(
  address: Address,
  flags: GlobalFlags
): Promise<{ balanceFormatted: number; balanceRaw: string }> {
  const url = `${getBaseUrl(flags.dev)}/api/rpc/balance/${address}`;

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

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      `Failed to parse balance API response as JSON (${res.status} ${res.statusText})`
    );
  }

  const result = balanceApiResponseSchema.safeParse(json);
  if (!result.success) {
    throw new Error(
      `Failed to safeParse balance API response (${res.status} ${res.statusText})`
    );
  }
  return {
    balanceFormatted: result.data.balance,
    balanceRaw: result.data.rawBalance,
  };
}
