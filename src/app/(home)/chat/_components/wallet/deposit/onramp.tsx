'use client';

import { useCallback, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';

export const Onramp = () => {
  const {
    mutate: createOnrampSession,
    isPending: isCreatingOnrampSession,
    isSuccess: isCreatedOnrampSession,
  } = api.onrampSessions.serverWallet.create.useMutation({
    onSuccess: url => {
      window.location.href = url;
    },
  });

  const [amount, setAmount] = useState(0);

  const handleSubmit = useCallback(() => {
    createOnrampSession({
      amount,
      redirect: window.location.href,
    });
  }, [amount, createOnrampSession]);

  return (
    <div className="flex flex-col gap-2">
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        inputClassName="placeholder:text-muted-foreground/60"
      />
      <Button
        variant="turbo"
        disabled={
          amount === 0 || isCreatingOnrampSession || isCreatedOnrampSession
        }
        onClick={handleSubmit}
      >
        {isCreatingOnrampSession ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating...
          </>
        ) : isCreatedOnrampSession ? (
          <>
            <Check className="size-4" />
            Opening Coinbase...
          </>
        ) : (
          'Buy on Coinbase'
        )}
      </Button>
    </div>
  );
};
