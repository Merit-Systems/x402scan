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

interface RedeemError {
  type: string;
  message: string;
  surface: string;
}

interface RedeemResponse {
  redemptionId: string;
  txHash: string;
  amount: string;
}

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

  const result = await safeFetchJson<'redeem', RedeemResponse, RedeemError>(
    'redeem',
    `${getBaseUrl(dev)}/api/invite/redeem`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        recipientAddr: address,
      }),
    },
    ({ message }) => message
  );

  if (result.isOk()) {
    setState({
      redeemedCodes: [...(state.redeemedCodes ?? []), code],
    });
  }

  return result;
};
