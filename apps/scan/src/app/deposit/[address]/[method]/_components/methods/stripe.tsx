'use client';

import { useEffect, useState } from 'react';

import z from 'zod';

import { DepositStatus, Status } from '../status';

import { api } from '@/trpc/client';

import { OnrampProviders } from '@/services/onramp/types';

import { depositSearchParamsSchema } from '../../../_lib/params';

import type { Address } from 'viem';
import type { MethodComponentProps } from '../../_types';
import type { DepositSearchParams } from '../../../_lib/params';

const paramsSchema = depositSearchParamsSchema.extend({
  id: z.string(),
});

export const Stripe: React.FC<MethodComponentProps> = ({
  searchParams,
  address,
}) => {
  const parsedParams = paramsSchema.safeParse(searchParams);

  if (!parsedParams.success) {
    return <p>Invalid parameters</p>;
  }

  const { id, ...rest } = parsedParams.data;

  return <StripeSessionContent id={id} address={address} searchParams={rest} />;
};

const StripeSessionContent: React.FC<{
  id: string;
  address: Address;
  searchParams: DepositSearchParams;
}> = ({ id, address, searchParams }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: session, isLoading } = api.onramp.stripe.session.get.useQuery(
    id,
    {
      refetchInterval: !isCompleted ? 1000 : undefined,
    }
  );

  useEffect(() => {
    if (
      session?.status === 'fulfillment_complete' ||
      session?.status === 'error'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCompleted(true);
    }
  }, [session]);

  return (
    <DepositStatus
      amount={{
        value: session
          ? Number(session.transaction_details.destination_amount)
          : undefined,
        isLoading,
      }}
      isSuccess={session?.status === 'fulfillment_complete'}
      isError={session?.status === 'error'}
      method={OnrampProviders.STRIPE}
      address={address}
      subtext={{
        [Status.SUCCESS]:
          'You can close this page and return to your MCP client to continue.',
        [Status.ERROR]:
          'There was an error processing your payment. Please try again.',
        [Status.PENDING]: 'This can take up to 10 minutes to complete.',
      }}
      searchParams={searchParams}
    />
  );
};
