import { useCallback, useEffect } from 'react';

import { Check, Loader2 } from 'lucide-react';

import {
  useSwitchAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { usdc } from '@/lib/tokens/usdc';

import { api } from '@/trpc/client';

import type { Address } from 'viem';
import type { Connector } from 'wagmi';
import { useEvmSend } from '@/app/_hooks/send/use-evm-send';

interface Props {
  connector: Connector;
  address: Address;
  amount: number;
  balance: {
    isLoading: boolean;
    value: number | undefined;
  };
}

export const TransferButton: React.FC<Props> = ({
  connector,
  address,
  amount,
  balance,
}) => {
  const { handleSubmit, isPending, isSent } = useEvmSend({
    address,
    amount,
    onSuccess: () => {
      toast.success('Transfer successful');
    },
  });

  return (
    <Button
      onClick={handleSubmit}
      disabled={
        isPending ||
        amount === 0 ||
        isSent ||
        balance.value === undefined ||
        balance.value < amount
      }
    >
      {balance.isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> <span>Loading...</span>
        </>
      ) : balance.value === undefined || balance.value < amount ? (
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
