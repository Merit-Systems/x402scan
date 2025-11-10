'use client';

import { Logo } from '@/components/logo';
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Stepper } from '@/components/ui/stepper';
import { api } from '@/trpc/client';
import { useCallback, useEffect, useState } from 'react';
import { steps } from './steps';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Deposit } from '../input/wallet/content/deposit';

export const Onboarding = () => {
  const utils = api.useUtils();

  const { data: hasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  const { mutate: acknowledgeComposerOnboarding, isPending: isAcknowledging } =
    api.user.acknowledgements.upsert.useMutation({
      onSuccess: () => {
        setStep(steps.length);
      },
      onError: () => {
        toast.error('There was an error finishing the onboarding process');
      },
    });

  const { data: usdcBalance } =
    api.user.serverWallet.usdcBaseBalance.useQuery();

  const hasBalance = (usdcBalance ?? 0) > 0;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (
      hasUserAcknowledgedComposer !== undefined &&
      !hasUserAcknowledgedComposer
    ) {
      setIsOpen(true);
    }
  }, [hasUserAcknowledgedComposer]);

  const [step, setStep] = useState(0);

  const isLastStep = step === steps.length - 1;

  const onNext = useCallback(() => {
    if (isLastStep) {
      acknowledgeComposerOnboarding();
    } else {
      setStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [setStep, acknowledgeComposerOnboarding, isLastStep]);

  const onPrevious = useCallback(() => {
    setStep(prev => Math.max(0, prev - 1));
  }, [setStep]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="p-0 overflow-hidden gap-0">
        <AlertDialogHeader className="bg-muted border-b p-4 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
              <Logo className="size-4" />
              <AlertDialogTitle>Let&apos;s Get Started</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm font-mono">
              We&apos;re excited to explore the x402 ecosystem with you
            </AlertDialogDescription>
          </div>
          <Stepper steps={steps} currentStep={step} />
        </AlertDialogHeader>
        <div className="py-4 flex flex-col gap-4 w-full max-w-full overflow-hidden">
          <div className="relative w-full overflow-hidden">
            {step < steps.length ? (
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  width: `${steps.length * 100}%`,
                  transform: `translateX(-${step * (100 / steps.length)}%)`,
                }}
              >
                {steps.map(({ component, heading, description }, idx) => (
                  <div
                    key={idx}
                    className="w-full shrink-0 grow-0 flex flex-col gap-4 px-4"
                    style={{
                      width: `${100 / steps.length}%`,
                    }}
                  >
                    <div>
                      <h2 className="font-bold">{heading}</h2>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {component}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full shrink-0 grow-0 flex flex-col gap-4 px-4">
                <div>
                  <h2 className="font-bold">
                    Fund Your Composer Wallet with USDC
                  </h2>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <Deposit
                    onSuccess={() => {
                      setIsOpen(false);
                      void utils.user.acknowledgements.hasAcknowledged.invalidate();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {step < steps.length ? (
          <div
            className={cn(
              'flex justify-between bg-muted border-t p-4',
              step === 0 ? 'justify-end' : 'justify-between'
            )}
          >
            {step > 0 && (
              <Button variant="outline" onClick={onPrevious}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
            <Button onClick={onNext} disabled={isAcknowledging}>
              {step === steps.length - 1 ? (
                <>
                  {isAcknowledging && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  I Understand
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          hasBalance && (
            <div className="w-full p-4 pt-0">
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full"
                variant="outline"
              >
                Continue
              </Button>
            </div>
          )
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
