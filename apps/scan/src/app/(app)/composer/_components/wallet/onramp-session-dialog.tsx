"use client";

import { useEffect, useRef, useState } from "react";

import { Check, Wallet, X } from "lucide-react";

import Image from "next/image";

import { useSearchParams } from "next/navigation";

import { AnimatedBeam, Circle } from "./animated-beam";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useEvmTokenBalance } from "@/app/(app)/composer/_hooks/balance/token/use-evm-token-balance";
import { useSPLTokenBalance } from "@/app/(app)/composer/_hooks/balance/token/use-svm-token-balance";

import { cn, formatCurrency } from "@/lib/utils";

import { SessionStatus, type OnrampSession } from "@x402scan/scan-db/types";

import { api } from "@/trpc/client";
import { usdc } from "@/lib/tokens/usdc";

import { Chain } from "@/types/chain";
import { optionalSupportedChainSchema } from "@/lib/schemas";

export const OnrampSessionDialog: React.FC = () => {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("onramp_token");
  const [dismissedSessionToken, setDismissedSessionToken] = useState<
    string | null
  >(null);
  const isSessionDialogOpen =
    sessionToken !== null && sessionToken !== dismissedSessionToken;

  const networkParamResult = optionalSupportedChainSchema.safeParse(
    searchParams.get("network")
  );

  const networkParam = networkParamResult.success
    ? networkParamResult.data
    : undefined;

  const { invalidate: invalidateEvmBalance } = useEvmTokenBalance({
    token: usdc(networkParam ?? Chain.BASE),
    query: {
      enabled: false,
    },
  });
  const { invalidate: invalidateSolanaBalance } = useSPLTokenBalance({
    enabled: false,
  });

  const {
    data: session,
    isLoading: isLoadingSession,
    refetch: refetchSession,
  } = api.user.onrampSessions.get.useQuery(sessionToken ?? "", {
    enabled: sessionToken !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ||
        status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED
        ? false
        : 1000;
    },
  });

  useEffect(() => {
    if (session && ["succeeded", "failed"].includes(session.status)) {
      // Invalidate balance query when session is completed
      if (session.status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (networkParam === Chain.SOLANA) {
              invalidateSolanaBalance();
            } else {
              invalidateEvmBalance();
            }
          }, i * 1000);
        }
      }
    }
  }, [session, invalidateEvmBalance, invalidateSolanaBalance, networkParam]);

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      setDismissedSessionToken(sessionToken);
    }
  };

  return (
    <Dialog open={isSessionDialogOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent className="gap-8 border sm:max-w-sm">
        <DialogHeader className="items-center">
          <DialogTitle>
            {isLoadingSession ? (
              <Skeleton className="h-10 w-24" />
            ) : session ? (
              formatCurrency(session.amount)
            ) : (
              "No Deposit Found"
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoadingSession ? (
              <Skeleton className="h-5 w-48" />
            ) : session ? (
              session.status ===
              SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS ? (
                "Your funds have arrived in your account!"
              ) : session.status ===
                SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED ? (
                "There was an error processing your payment."
              ) : (
                "Waiting for Coinbase Response"
              )
            ) : (
              "If you are trying to deposit funds, refresh or create a new deposit session."
            )}
          </DialogDescription>
        </DialogHeader>
        <SessionGraphic session={session} />
        <DialogFooter className="flex gap-4 sm:flex-col sm:space-x-0">
          {isLoadingSession ? (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : session ? (
            <>
              <p className="type-supporting-body text-center opacity-60">
                {session.status ===
                SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS
                  ? "Complete your checkout on Coinbase"
                  : session.status ===
                      SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS
                    ? "You can close this safely"
                    : `Coinbase returned an error processing your payment: ${String(session.failureReason)}`}
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  handleOnOpenChange(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void refetchSession()}
              >
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  handleOnOpenChange(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
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
    "rounded-full border size-16 md:size-24 bg-card flex justify-center items-center p-0 overflow-hidden";

  const status =
    session?.status ?? SessionStatus.ONRAMP_TRANSACTION_STATUS_IN_PROGRESS;
  const isFailed = status === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED;

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
          className={cn(itemClassName, "border-primary/80 border-2")}
        >
          <Wallet className="size-10 md:size-12" />
        </Circle>
      </div>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={sourceRef}
        toRef={destinationRef}
        delay={0}
        duration={2}
        endXOffset={0}
        endYOffset={0}
        startXOffset={0}
        startYOffset={0}
        pathWidth={4}
        isFull={
          status === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS || isFailed
        }
        pathColor={isFailed ? "rgb(var(--destructive))" : undefined}
        gradientStartColor={isFailed ? "rgb(var(--destructive))" : undefined}
        gradientStopColor={isFailed ? "rgb(var(--destructive))" : undefined}
      />
    </div>
  );
};

const StepState = ({ stepState }: { stepState: OnrampSession["status"] }) => {
  const classNames = {
    container: "rounded-full size-8 md:size-10 p-2 z-10",
    icon: "size-full",
  };

  if (stepState === SessionStatus.ONRAMP_TRANSACTION_STATUS_SUCCESS) {
    return (
      <div className={cn(classNames.container, "bg-primary")}>
        <Check className={classNames.icon} />
      </div>
    );
  }
  if (stepState === SessionStatus.ONRAMP_TRANSACTION_STATUS_FAILED) {
    return (
      <div className={cn(classNames.container, "bg-destructive")}>
        <X className={classNames.icon} />
      </div>
    );
  }

  return <div className={classNames.container} />;
};
