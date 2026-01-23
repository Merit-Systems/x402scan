'use client';

import { useCallback, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TokenInput } from '@/components/ui/token/token-input';

import { useWalletChain } from '@/app/(app)/_contexts/wallet-chain/hook';

import { api } from '@/trpc/client';

import { usdc } from '@/lib/tokens/usdc';

export const OnrampContent = () => {
  const { chain } = useWalletChain();

  const {
    mutate: createOnrampSession,
    isPending: isCreatingOnrampSession,
    isSuccess: isCreatedOnrampSession,
  } = api.user.onrampSessions.create.useMutation({
    onSuccess: url => {
      window.location.href = url;
    },
  });

  const [amount, setAmount] = useState(0);

  const handleSubmit = useCallback(() => {
    createOnrampSession({
      amount,
      redirect: window.location.href,
      defaultNetwork: chain,
    });
  }, [amount, createOnrampSession, chain]);

  return (
    <div className="flex flex-col gap-2">
      <TokenInput
        onChange={setAmount}
        selectedToken={usdc(chain)}
        label="Amount"
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
          'Onramp'
        )}
      </Button>
    </div>
  );
};
