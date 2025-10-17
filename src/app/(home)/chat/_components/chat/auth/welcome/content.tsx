'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Stepper } from '@/components/ui/stepper';

import { welcomeSteps } from './steps';

import { cn } from '@/lib/utils';

import { api } from '@/trpc/client';
import { Logo } from '@/components/logo';

interface Props {
  initialStep: number;
}

export const WelcomeContent: React.FC<Props> = ({ initialStep }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(initialStep);

  const { status: accountStatus } = useAccount();
  const { data: session, status: sessionStatus } = useSession();
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.serverWallet.usdcBaseBalance.useQuery(undefined, {
      enabled: Boolean(session),
    });

  const isLoading =
    accountStatus === 'reconnecting' ||
    accountStatus === 'connecting' ||
    sessionStatus === 'loading' ||
    isLoadingUsdcBalance;

  useEffect(() => {
    if (isLoading) return;
    if (!Boolean(session)) {
      setStep(1);
      return;
    }
    if (!usdcBalance) {
      setStep(2);
      return;
    }
    setIsOpen(false);
  }, [accountStatus, session, usdcBalance, isLoading]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="p-0 overflow-hidden gap-0">
        <AlertDialogHeader className="flex flex-row items-center gap-4 space-y-0 bg-muted border-b p-4">
          <Logo className="size-12" />
          <div>
            <AlertDialogTitle>Set up Your Agent</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-mono">
              Build agents that pay for their inference and invoke resources and
              pay for them with x402.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="w-full flex flex-col gap-6 pt-6 max-w-full overflow-hidden">
          <div className="w-full px-4">
            <Stepper steps={welcomeSteps} currentStep={step} />
          </div>
          <div className="w-full flex flex-col relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${step * 100}%)`,
              }}
            >
              {welcomeSteps.map((s, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 flex flex-col gap-4 overflow-hidden"
                  style={{ width: '100%' }}
                  data-step={index}
                  tabIndex={index === step ? undefined : -1}
                >
                  <div
                    className={cn(
                      'w-full h-fit animate-fadeInUp flex flex-col gap-4'
                    )}
                  >
                    {s.component}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
