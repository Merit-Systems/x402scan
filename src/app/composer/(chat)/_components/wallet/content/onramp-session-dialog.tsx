'use client';

import { useEffect, useRef, useState } from 'react';

import { Bot, Check, X } from 'lucide-react';

import { AnimatedBeam, Circle } from '@/components/magicui/animated-beam';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';

import { cn, formatCurrency } from '@/lib/utils';

import { SessionStatus, type OnrampSession } from '@prisma/client';

import { api } from '@/trpc/client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export const OnrampSessionDialog: React.FC = () => {
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const utils = api.useUtils();

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('server_wallet_onramp_token')) {
      setSessionToken(searchParams.get('server_wallet_onramp_token') ?? null);
      setIsSessionDialogOpen(true);
    }
  }, [searchParams]);

  const [isCompleted, setIsCompleted] = useState(false);
  const [isError, setIsError] = useState(false);

  const {
    data: session,
    isLoading: isLoadingSession,
    isError: isErrorSession,
    refetch: refetchSession,
  } = api.user.onrampSessions.get.useQuery(sessionToken ?? '', {
    enabled: !!sessionToken && !isError,
    refetchInterval: !isCompleted ? 1000 : false,
  });

  useEffect(() => {
    if (isErrorSession) {
      setIsError(true);
    }
  }, [isErrorSession]);

  useEffect(() => {
    if (
      session &&
      (session.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ||
        session.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED)
    ) {
      setIsCompleted(true);

      // Invalidate balance query when session is completed
      if (session.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS) {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            void utils.user.serverWallet.usdcBaseBalance.invalidate();
          }, i * 1000);
        }
        // Clear the URL search params when onramp session is completed
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('server_wallet_onramp_token');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
  }, [session, utils]);

  const handleOnOpenChange = (open: boolean) => {
    setIsSessionDialogOpen(open);
    setTimeout(() => {
      if (
        session?.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ||
        session?.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
      ) {
        setSessionToken('');
      }
    }, 1000);
  };

  return (
    <Dialog open={isSessionDialogOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent className="border-primary shadow-primary gap-8 rounded-xl border shadow-[0_0_16px] sm:max-w-sm">
        <DialogHeader className="items-center">
          <DialogTitle className="text-primary text-4xl font-bold">
            <Loading
              value={session}
              isLoading={isLoadingSession}
              component={session => `${formatCurrency(session.amount)}`}
              loadingComponent={<Skeleton className="h-10 w-24" />}
              errorComponent={'No Amount Found'}
            />
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-base font-semibold">
            <Loading
              value={session}
              isLoading={isLoadingSession}
              component={session => {
                switch (session.status) {
                  case SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS:
                    return 'Waiting for Coinbase Response';
                  case SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS:
                    return 'Your funds have arrived in your account!';
                  case SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED:
                    return 'There was an error processing your payment.';
                  default:
                    return 'Waiting for Coinbase Response';
                }
              }}
              loadingComponent={<Skeleton className="h-5 w-48" />}
              errorComponent={
                'If you are trying to deposit funds, refresh or create a new session.'
              }
            />
          </DialogDescription>
        </DialogHeader>
        <SessionGraphic session={session} />
        <DialogFooter className="flex gap-4 sm:flex-col sm:space-x-0">
          <Loading
            value={session}
            isLoading={isLoadingSession}
            component={session => (
              <>
                <p className="text-center text-sm opacity-60">
                  {session.status ===
                  SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS
                    ? 'Complete your checkout on Coinbase'
                    : session.status ===
                        SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS
                      ? 'You can close this safely'
                      : session.status ===
                          SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
                        ? `Coinbase returned an error processing your payment: ${session.failureReason}`
                        : ''}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => handleOnOpenChange(false)}
                  className="bg-foreground/5 hover:bg-foreground/10 w-full font-bold"
                >
                  Close
                </Button>
              </>
            )}
            loadingComponent={
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-9 w-full" />
              </>
            }
            errorComponent={
              <>
                <Button
                  variant="outline"
                  className="w-full font-bold"
                  onClick={() => refetchSession()}
                >
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleOnOpenChange(false)}
                  className="bg-foreground/5 hover:bg-foreground/10 w-full font-bold"
                >
                  Close
                </Button>
              </>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SessionGraphic = ({
  session,
}: {
  session: OnrampSession | undefined;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  const itemClassName =
    'rounded-full border size-16 md:size-24 bg-card flex justify-center items-center p-0 overflow-hidden';

  const beamProps = (state: SessionStatus) => ({
    containerRef,
    delay: 0,
    duration: 2,
    endXOffset: 0,
    endYOffset: 0,
    startXOffset: 0,
    startYOffset: 0,
    pathWidth: 4,
    isFull:
      state === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ||
      state === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED,
    pathColor:
      state === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
        ? 'rgb(var(--destructive))'
        : undefined,
    gradientStartColor:
      state === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
        ? 'rgb(var(--destructive))'
        : undefined,
    gradientStopColor:
      state === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
        ? 'rgb(var(--destructive))'
        : undefined,
    isDisabled: state === SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS,
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Circle ref={sourceRef} className={itemClassName}>
          <Image
            src="/coinbase.png"
            alt="Coinbase"
            width={120}
            height={120}
            className="size-full"
          />
        </Circle>
        <StepState
          stepState={
            session?.status ??
            SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS
          }
        />
        <Circle
          ref={destinationRef}
          className={cn(itemClassName, 'border-primary/80 border-2')}
        >
          <Bot className="size-10 md:size-12" />
        </Circle>
      </div>
      <AnimatedBeam
        fromRef={sourceRef}
        toRef={destinationRef}
        {...beamProps(
          session?.status ?? SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS
        )}
      />
    </div>
  );
};

const StepState = ({ stepState }: { stepState: OnrampSession['status'] }) => {
  const classNames = {
    container: 'rounded-full size-8 md:size-10 p-2 z-10',
    icon: 'size-full',
  };

  if (stepState === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS) {
    return (
      <div className={cn(classNames.container, 'bg-primary')}>
        <Check className={classNames.icon} />
      </div>
    );
  }
  if (stepState === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED) {
    return (
      <div className={cn(classNames.container, 'bg-destructive')}>
        <X className={classNames.icon} />
      </div>
    );
  }

  return <div className={classNames.container} />;
};
