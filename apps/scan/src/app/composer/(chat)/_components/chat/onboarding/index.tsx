'use client';

import { useCallback, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';

import { Logo } from '@/components/logo';

import { api } from '@/trpc/client';

import { steps } from './steps';

import { cn } from '@/lib/utils';

export const Onboarding = () => {
  const utils = api.useUtils();

  const [isOpen, setIsOpen] = useState(false);

  const { data: hasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  const { mutate: acknowledgeComposerOnboarding, isPending: isAcknowledging } =
    api.user.acknowledgements.upsert.useMutation({
      onSuccess: () => {
        void utils.user.acknowledgements.hasAcknowledged.invalidate();
        setIsOpen(false);
      },
      onError: () => {
        toast.error('There was an error finishing the onboarding process');
      },
    });

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
          <Stepper steps={steps} currentStep={step} setCurrentStep={setStep} />
        </AlertDialogHeader>
        <div className="pt-4 flex flex-col gap-4 w-full max-w-full overflow-hidden">
          <div className="relative w-full overflow-hidden flex flex-col gap-4">
            <div
              className="flex transition-transform duration-500 ease-in-out pb-4"
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
          </div>
        </div>
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
                {isAcknowledging && <Loader2 className="size-4 animate-spin" />}
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
      </AlertDialogContent>
    </AlertDialog>
  );
};
