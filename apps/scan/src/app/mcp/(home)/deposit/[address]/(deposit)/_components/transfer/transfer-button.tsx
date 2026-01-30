import { Check, Loader2 } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { useEvmSend } from '@/app/(app)/_hooks/send/use-evm-send';
import { useEvmTokenBalance } from '@/app/(app)/_hooks/balance/token/use-evm-token-balance';

import { OnrampMethods } from '@/services/onramp/types';

import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';

import type { Address } from 'viem';
import type { Connection } from 'wagmi';
import type { Route } from 'next';
import type { DepositSearchParams } from '../../../_lib/params';

interface Props {
  connection: Connection;
  address: Address;
  amount: number;
  searchParams?: DepositSearchParams;
}

export const TransferButton: React.FC<Props> = ({
  connection,
  address,
  amount,
  searchParams,
}) => {
  const router = useRouter();

  const { invalidate: invalidateToBalance } = useEvmTokenBalance({
    token: usdc(Chain.BASE),
    address,
  });

  const {
    data: balance,
    isLoading: isBalanceLoading,
    invalidate: invalidateBalance,
  } = useEvmTokenBalance({
    token: usdc(Chain.BASE),
    address: connection?.accounts[0],
  });

  const { handleSubmit, isPending, isSent } = useEvmSend({
    address,
    amount,
    connection,
    onSuccess: ({ paymentResponse }) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          void invalidateBalance();
          void invalidateToBalance();
        }, i * 1000);
      }
      if (paymentResponse) {
        setTimeout(() => {
          const params = new URLSearchParams(searchParams ?? {});
          params.set('hash', paymentResponse.transaction);
          router.push(
            `/mcp/deposit/${address}/${OnrampMethods.WALLET}?${params.toString()}` as Route
          );
        }, 3000);
      }
    },
  });

  return (
    <Button
      onClick={handleSubmit}
      disabled={
        isPending ||
        amount === 0 ||
        isSent ||
        balance === undefined ||
        balance < amount
      }
    >
      {isBalanceLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> <span>Loading...</span>
        </>
      ) : balance === undefined || balance < amount ? (
        <>
          <span>Insufficient balance</span>
        </>
      ) : isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Depositing...</span>
        </>
      ) : isSent ? (
        <>
          <Check className="size-4" />
          <span>Deposited</span>
        </>
      ) : amount === 0 ? (
        'Enter an Amount'
      ) : (
        'Deposit'
      )}
    </Button>
  );
};
