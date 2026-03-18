'use client';

import Image from 'next/image';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';

import type { OnrampProviderDialogContentProps } from '../types';

export const CoinbaseOnrampDialogContent: React.FC<
  OnrampProviderDialogContentProps
> = ({ amount, address, searchParams }) => {
  const { mutate: createCoinbaseOnrampSession, isPending } =
    api.onramp.coinbase.session.create.useMutation({
      onSuccess: data => {
        window.location.href = data;
      },
    });

  return (
    <div className="flex flex-col items-center gap-4 py-8 pb-4 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <Image src="/coinbase.png" alt="Coinbase" width={48} height={48} />
        <h1 className="text-2xl font-bold">Deposit via Coinbase</h1>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        If you do not have a Coinbase account, you may incur additional fees.
      </p>
      <Button
        onClick={() =>
          createCoinbaseOnrampSession({
            amount,
            redirect: `${window.location.href}/coinbase`,
            redirectSearchParams: searchParams,
            tokenKey: 'id',
            address,
          })
        }
        disabled={isPending}
        className="w-full"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
      </Button>
    </div>
  );
};
