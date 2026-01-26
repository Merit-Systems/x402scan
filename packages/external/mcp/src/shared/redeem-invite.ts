import z from 'zod';

import { safeFetchJson } from '@/shared/neverthrow/fetch';
import { err } from '@x402scan/neverthrow';

import { getBaseUrl } from './utils';
import { getState, setState } from './state';

import type { Address } from 'viem';

export interface RedeemInviteProps {
  code: string;
  dev: boolean;
  address: Address;
  surface: string;
}

export const redeemInviteCode = async ({
  code,
  dev,
  address,
  surface,
}: RedeemInviteProps) => {
  const state = getState();

  if (state.redeemedCodes?.includes(code)) {
    return err('user', surface, {
      cause: 'conflict',
      message: 'This invite code has already been redeemed',
    });
  }

  const result = await safeFetchJson(
    surface,
    new Request(`${getBaseUrl(dev)}/api/invite/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        recipientAddr: address,
      }),
    }),
    z.object({
      redemptionId: z.string(),
      txHash: z.string(),
      amount: z.coerce.number(),
    })
  );

  if (result.isOk()) {
    setState({
      redeemedCodes: [...(state.redeemedCodes ?? []), code],
    });
  }

  return result;
};
