import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import type { Address } from 'viem';
import type { Connector } from 'wagmi';
import { useEvmSend } from '@/app/_hooks/send/use-evm-send';
import { useCallback } from 'react';
import { Chain, CHAIN_ID } from '@/types/chain';

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
    connector,
    onSuccess: () => {
      toast.success('Transfer successful');
    },
  });

  const onClick = useCallback(async () => {
    if (connector.chainId !== CHAIN_ID[Chain.BASE]) {
      await connector.switchChain?.({
        chainId: CHAIN_ID[Chain.BASE],
      });
    }
    handleSubmit();
  }, [handleSubmit, connector]);

  return (
    <Button
      onClick={() => void onClick()}
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
