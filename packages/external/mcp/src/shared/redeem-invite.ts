import { errAsync } from 'neverthrow';

import { safeFetchJson } from '@x402scan/neverthrow/fetch';

import { getBaseUrl } from './utils';
import { getState, setState } from './state';

import type { Address } from 'viem';

export interface RedeemInviteProps {
  code: string;
  dev: boolean;
  address: Address;
}

interface RedeemResponse {
  redemptionId: string;
  txHash: string;
  amount: string;
}

const surface = 'redeem';

export const redeemInviteCode = async ({
  code,
  dev,
  address,
}: {
  code: string;
  dev: boolean;
  address: Address;
}) => {
  const state = getState();

  if (state.redeemedCodes?.includes(code)) {
    return Promise.resolve(
      errAsync({
        success: false,
        message: 'This invite code has already been redeemed',
      })
    );
  }

  const result = await safeFetchJson<typeof surface, RedeemResponse>(
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
    })
  );

  if (result.isOk()) {
    setState({
      redeemedCodes: [...(state.redeemedCodes ?? []), code],
    });
  }

  return result;
};
