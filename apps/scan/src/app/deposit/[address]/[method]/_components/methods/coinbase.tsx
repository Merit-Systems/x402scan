'use client';

import { useEffect, useState } from 'react';

import z from 'zod';

import { DepositStatus } from '../status';

import { api } from '@/trpc/client';

import { OnrampProviders } from '@/services/onramp/types';

import type { Address } from 'viem';
import type { MethodComponentProps } from '../../_types';
import {
  DepositSearchParams,
  depositSearchParamsSchema,
} from '../../../_lib/params';

const paramsSchema = depositSearchParamsSchema.extend({
  id: z.string(),
});

export const Coinbase: React.FC<MethodComponentProps> = ({
  searchParams,
  address,
}) => {
  const parsedParams = paramsSchema.safeParse(searchParams);

  if (!parsedParams.success) {
    return <p>Invalid parameters</p>;
  }

  const { id, ...rest } = parsedParams.data;

  return (
    <CoinbaseSessionContent id={id} address={address} searchParams={rest} />
  );
};

const CoinbaseSessionContent: React.FC<{
  id: string;
  address: Address;
  searchParams: DepositSearchParams;
}> = ({ id, address, searchParams }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: session, isLoading } = api.onramp.coinbase.session.get.useQuery(
    id,
    {
      refetchInterval: !isCompleted ? 1000 : undefined,
    }
  );

  useEffect(() => {
    if (
      session?.status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS' ||
      session?.status === 'ONRAMP_TRANSACTION_STATUS_FAILED'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCompleted(true);
    }
  }, [session]);

  return (
    <DepositStatus
      amount={{
        value: session ? Number(session.purchase_amount.value) : undefined,
        isLoading,
      }}
      isSuccess={session?.status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS'}
      isError={session?.status === 'ONRAMP_TRANSACTION_STATUS_FAILED'}
      method={OnrampProviders.COINBASE}
      address={address}
      searchParams={searchParams}
    />
  );
};
