'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Check, Wallet, X } from 'lucide-react';

import Image from 'next/image';

import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { AnimatedBeam, Circle } from '@/components/magicui/animated-beam';

import { useEvmTokenBalance } from '@/app/(app)/_hooks/balance/token/use-evm-token-balance';

import { cn } from '@/lib/utils';

import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';

import { OnrampMethods } from '@/services/onramp/types';

import type { Methods } from '../_types';

import type { Address } from 'viem';
import Link from 'next/link';
import type { DepositSearchParams } from '../../_lib/params';

export enum Status {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
}

interface Props {
  amount: {
    value: number | undefined;
    isLoading: boolean;
  };
  isSuccess: boolean;
  isError: boolean;
  method: Methods;
  address: Address;
  subtext?: Record<Status, string | undefined>;
  searchParams?: DepositSearchParams;
}

export const DepositStatus: React.FC<Props> = ({
  isSuccess,
  isError,
  amount,
  method,
  address,
  subtext = {
    [Status.SUCCESS]:
      'You can close this page and return to your MCP client to continue.',
    [Status.ERROR]:
      'There was an error processing your payment. Please try again.',
    [Status.PENDING]: undefined,
  },
  searchParams,
}) => {
  const { invalidate: invalidateBalance } = useEvmTokenBalance({
    token: usdc(Chain.BASE),
    query: {
      enabled: false,
    },
  });

  const status = useMemo(() => {
    switch (true) {
      case isSuccess:
        return Status.SUCCESS;
      case isError:
        return Status.ERROR;
      default:
        return Status.PENDING;
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (isSuccess) {
      if (searchParams?.redirectUri) {
        window.location.href = searchParams.redirectUri;
      }
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          void invalidateBalance();
        }, i * 1000);
      }
    }
  }, [isSuccess, invalidateBalance, searchParams]);

  return (
    <div className="flex flex-col gap-8 sm:max-w-sm max-w-lg w-full">
      <div className="flex flex-col items-center gap-2">
        <Loading
          value={amount.value}
          isLoading={amount.isLoading}
          component={amount => (
            <h1 className="text-primary text-4xl font-bold">{amount} USDC</h1>
          )}
          loadingComponent={<Skeleton className="h-9 my-0.5 w-24" />}
          errorComponent={<p>Error loading amount</p>}
        />
        <p className="text-muted-foreground text-center text-base font-semibold">
          {status === Status.SUCCESS
            ? 'Your funds have arrived in your account!'
            : status === Status.ERROR
              ? 'There was an error processing your payment.'
              : 'Waiting for your funds to arrive in your account...'}
        </p>
      </div>
      <SessionGraphic status={status} method={method} />
      <div className="flex flex-col gap-4">
        {status === Status.ERROR && (
          <Link href={`/mcp/deposit/${address}`}>
            <Button className="w-full">Go Back</Button>
          </Link>
        )}
        {subtext[status] && !searchParams?.redirectUri && (
          <p className="text-muted-foreground text-center text-sm">
            {subtext[status]}
          </p>
        )}
      </div>
    </div>
  );
};

interface SessionGraphicProps {
  status: Status;
  method: Methods;
}

const SessionGraphic: React.FC<SessionGraphicProps> = ({ status, method }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  const itemClassName =
    'rounded-full border size-16 md:size-24 bg-card flex justify-center items-center p-0 overflow-hidden';

  const beamProps = (status: Status) => ({
    containerRef,
    delay: 0,
    duration: 2,
    endXOffset: 0,
    endYOffset: 0,
    startXOffset: 0,
    startYOffset: 0,
    pathWidth: 4,
    isFull: status === Status.SUCCESS || status === Status.ERROR,
    pathColor: status === Status.ERROR ? 'rgb(var(--destructive))' : undefined,
    gradientStartColor:
      status === Status.ERROR ? 'rgb(var(--destructive))' : undefined,
    gradientStopColor:
      status === Status.ERROR ? 'rgb(var(--destructive))' : undefined,
    isDisabled: status === Status.PENDING,
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Circle ref={sourceRef} className={itemClassName}>
          {method === OnrampMethods.WALLET ? (
            <Wallet className="size-10 md:size-12" />
          ) : (
            <Image
              src={`/${method}.png`}
              alt={method}
              width={120}
              height={120}
              className="size-full"
            />
          )}
        </Circle>
        <StepState status={status} />
        <Circle ref={destinationRef} className={cn(itemClassName, 'border-2')}>
          <Image
            src={`/mcp.png`}
            alt={method}
            width={120}
            height={120}
            className="size-full"
          />
        </Circle>
      </div>
      <AnimatedBeam
        fromRef={sourceRef}
        toRef={destinationRef}
        {...beamProps(status)}
      />
    </div>
  );
};

const StepState = ({ status }: { status: Status }) => {
  const classNames = {
    container: 'rounded-full size-8 md:size-10 p-2 z-10',
    icon: 'size-full',
  };

  if (status === Status.SUCCESS) {
    return (
      <div className={cn(classNames.container, 'bg-primary')}>
        <Check className={classNames.icon} />
      </div>
    );
  }
  if (status === Status.ERROR) {
    return (
      <div className={cn(classNames.container, 'bg-destructive')}>
        <X className={classNames.icon} />
      </div>
    );
  }

  return <div className={classNames.container} />;
};
