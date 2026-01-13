import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useEvmSend } from '@/app/_hooks/send/use-evm-send';
import { useEvmTokenBalance } from '@/app/_hooks/balance/token/use-evm-token-balance';

import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';

import type { Address } from 'viem';
import type { Connection } from 'wagmi';

interface Props {
  connection: Connection;
  address: Address;
  amount: number;
}

export const TransferButton: React.FC<Props> = ({
  connection,
  address,
  amount,
}) => {
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
    onSuccess: () => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          void invalidateBalance();
          void invalidateToBalance();
        }, i * 1000);
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
