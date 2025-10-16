'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { signInWithEthereum } from '@/auth/providers/siwe/sign-in';

interface VerifyWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifyWalletModal({
  open,
  onOpenChange,
}: VerifyWalletModalProps) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { mutate: handleVerify, isPending: isVerifying } = useMutation({
    mutationFn: () =>
      signInWithEthereum({
        address: address!,
        chainId: 8453,
        signMessage: message => signMessageAsync({ message }),
        redirectTo: window.location.href,
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Verify your wallet</DialogTitle>
          <DialogDescription>
            Please sign a message to verify you own this wallet before you use
            the chat.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button onClick={() => handleVerify()} disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Wallet className="size-4" />
                Verify Wallet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
