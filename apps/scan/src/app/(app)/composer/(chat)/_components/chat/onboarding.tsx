'use client';

import { Loader2 } from 'lucide-react';

import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { Logo } from '@/components/logo';

import { api } from '@/trpc/client';

import Link from 'next/link';

export const Onboarding = () => {
  const utils = api.useUtils();

  const { data: hasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  const { mutate: acknowledgeComposerOnboarding, isPending: isAcknowledging } =
    api.user.acknowledgements.upsert.useMutation({
      onSuccess: () => {
        void utils.user.acknowledgements.hasAcknowledged.invalidate();
      },
      onError: () => {
        toast.error('There was an error finishing the onboarding process');
      },
    });

  return (
    <AlertDialog open={hasUserAcknowledgedComposer === false}>
      <AlertDialogContent className="p-0 overflow-hidden gap-2 sm:max-w-sm">
        <AlertDialogHeader className="bg-muted border-b p-4 gap-4">
          <div className="flex flex-col gap-2 items-center">
            <Logo className="size-8" />
            <AlertDialogTitle>Let&apos;s Get Started</AlertDialogTitle>
            <AlertDialogDescription className="hidden">
              Please acknowledge our Terms of Service and Privacy Policy to
              continue.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="p-4 flex flex-col gap-4 w-full max-w-full overflow-hidden">
          <p className="text-sm text-center">
            Please acknowledge our{' '}
            <Link
              href="/tos"
              className="underline text-primary font-bold"
              target="_blank"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline text-primary font-bold"
              target="_blank"
            >
              Privacy Policy
            </Link>{' '}
            to continue.
          </p>
        </div>
        <div className="p-4 border-t bg-muted">
          <Button
            onClick={() => acknowledgeComposerOnboarding()}
            disabled={isAcknowledging}
            className="w-full"
          >
            {isAcknowledging && <Loader2 className="size-4 animate-spin" />}I
            Understand
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
