'use client';

import React from 'react';

import { Loader2, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  onSignIn: () => void;
  isPending: boolean;
};

export const NoSessionContent: React.FC<Props> = ({ onSignIn, isPending }) => {
  return (
    <div className="flex flex-col gap-2">
      <Button variant="turbo" onClick={onSignIn} disabled={isPending}>
        {isPending ? (
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
      <p className="text-xs text-muted-foreground">
        Please sign a message to verify you own this wallet before you use the
        Onramp.
      </p>
    </div>
  );
};
