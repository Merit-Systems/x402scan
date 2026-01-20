import { errAsync } from 'neverthrow';

import { safeFetchJson } from './safe-fetch';
import { getBaseUrl } from './utils';
import { getState, setState } from './state';

import type { Address } from 'viem';

export interface RedeemInviteProps {
  code: string;
  dev: boolean;
  address: Address;
}

interface RedeemError {
  success: false;
  message: string;
}

interface RedeemResponse {
  success: true;
  data: {
    redemptionId: string;
    txHash: string;
    amount: string;
  };
}

export const redeemInviteCode = async ({
  code,
  dev,
  address,
}: RedeemInviteProps) => {
  const state = getState();

  if (state.redeemedCodes?.includes(code)) {
    return errAsync({
      success: false,
      message: 'This invite code has already been redeemed',
    });
  }

  return await safeFetchJson<RedeemResponse, RedeemError>(
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
  ).andTee(result => {
    if (result.success) {
      setState({
        redeemedCodes: [...(state.redeemedCodes ?? []), code],
      });
    }
  });
};
