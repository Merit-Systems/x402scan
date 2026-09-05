"use client";

import { Loader2 } from "lucide-react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { Logo } from "@/components/ui/logo";

import { api } from "@/trpc/client";

import Link from "next/link";

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
        toast.error("There was an error finishing the onboarding process");
      },
    });

  return (
    <AlertDialog open={hasUserAcknowledgedComposer === false}>
      <AlertDialogContent className="gap-2 overflow-hidden sm:max-w-sm">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-2">
            <Logo className="size-8" />
            <AlertDialogTitle>Let&apos;s Get Started</AlertDialogTitle>
            <AlertDialogDescription className="hidden">
              Please acknowledge our Terms of Service and Privacy Policy to
              continue.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="flex w-full max-w-full flex-col gap-4 overflow-hidden p-4">
          <p className="type-supporting-body text-center">
            Please acknowledge our{" "}
            <Link
              href="/tos"
              className="text-primary underline"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary underline"
              target="_blank"
            >
              Privacy Policy
            </Link>{" "}
            to continue.
          </p>
        </div>
        <div className="border-t bg-muted p-4">
          <Button
            onClick={() => {
              acknowledgeComposerOnboarding();
            }}
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
