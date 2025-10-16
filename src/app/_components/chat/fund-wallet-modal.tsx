'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { api } from '@/trpc/client';
import { Address } from '@/components/ui/address';

const DISMISS_KEY = 'fundWalletDismissed';

interface FundWalletModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FundWalletModal(props: FundWalletModalProps) {
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === 'authenticated';

  const { data: usdcBalance } = api.serverWallet.usdcBaseBalance.useQuery(
    undefined,
    {
      enabled: isAuthed,
    }
  );

  const { data: address, isLoading: isLoadingAddress } =
    api.serverWallet.address.useQuery(undefined, {
      enabled: isAuthed,
    });

  const isControlled =
    typeof props.open === 'boolean' && typeof props.onOpenChange === 'function';
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? props.open! : internalOpen;
  const setOpen = isControlled ? props.onOpenChange! : setInternalOpen;

  const dismissed = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem(DISMISS_KEY) === '1';
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setOpen(false);
      return;
    }
    if (
      !isControlled &&
      typeof usdcBalance === 'number' &&
      usdcBalance === 0 &&
      !dismissed
    ) {
      setOpen(true);
    }
  }, [isAuthed, usdcBalance, dismissed, isControlled, setOpen]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Fund your server wallet</DialogTitle>
          <DialogDescription>
            Your verified wallet has {usdcBalance} USDC on Base. You can dismiss
            this warning to continue exploring. WARNING I HAVE NOT BUILT A WAY
            TO GET YOUR USDC OUT SO YOU WILL LOSE FUNDS IF YOU SEND TOO MUCH.
            CONTACT ME IF THIS HAPPENS ben@merit.systems FUNDS ARE NOT SAFU
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4" />
            <span className="text-sm text-muted-foreground">
              Server wallet address
            </span>
          </div>
          <div>
            {isLoadingAddress ? (
              <span className="text-xs text-muted-foreground">
                Loading address…
              </span>
            ) : address ? (
              <Address address={address} />
            ) : (
              <span className="text-xs text-muted-foreground">
                No address available
              </span>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="secondary" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
