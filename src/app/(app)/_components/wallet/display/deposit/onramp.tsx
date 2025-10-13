'use client';

import { useCallback, useState } from 'react';

import Image from 'next/image';

import { Check, Loader2, Wallet } from 'lucide-react';

import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';
import { useSession } from 'next-auth/react';
import { useAccount, useSignMessage } from 'wagmi';
import { signInWithEthereum } from '@/auth/providers/siwe/sign-in';
import { useMutation } from '@tanstack/react-query';

export const Onramp = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="gap-1 flex items-center">
        <Image
          src="/coinbase.png"
          alt="Base"
          height={16}
          width={16}
          className="size-4 inline-block mr-1 rounded-full"
        />
        <span className="font-bold text-sm">Onramp</span>
      </div>
      {session ? <OnrampContent /> : <NoSessionContent />}
    </div>
  );
};

const NoSessionContent = () => {
  const { address } = useAccount();

  const { signMessageAsync } = useSignMessage();

  const { mutate: handleVerify, isPending } = useMutation({
    mutationFn: () => {
      return signInWithEthereum({
        address: address!,
        chainId: 8453,
        signMessage: message => signMessageAsync({ message }),
        redirectTo: `${window.location.href}?onramp=true`,
      });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="turbo"
        onClick={() => handleVerify()}
        disabled={isPending}
      >
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

const OnrampContent = () => {
  const {
    mutate: createOnrampSession,
    isPending: isCreatingOnrampSession,
    isSuccess: isCreatedOnrampSession,
  } = api.onrampSessions.create.useMutation({
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
          'Onramp'
        )}
      </Button>
    </div>
  );
};
