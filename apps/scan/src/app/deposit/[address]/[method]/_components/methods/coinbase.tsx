'use client';

import z from 'zod';
import { MethodComponentProps } from '../../_types';
import { api } from '@/trpc/client';
import { DepositStatus } from '../status';
import { useEffect, useState } from 'react';
import { OnrampProviders } from '@/services/onramp/types';

const paramsSchema = z.object({
  id: z.string(),
});

export const Coinbase: React.FC<MethodComponentProps> = ({ searchParams }) => {
  const parsedParams = paramsSchema.safeParse(searchParams);

  if (!parsedParams.success) {
    return <p>Invalid parameters</p>;
  }

  const { id } = parsedParams.data;

  return <CoinbaseSessionContent id={id} />;
};

const CoinbaseSessionContent: React.FC<{ id: string }> = ({ id }) => {
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
    />
  );
};
