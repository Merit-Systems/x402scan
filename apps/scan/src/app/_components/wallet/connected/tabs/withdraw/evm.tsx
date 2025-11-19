import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useEvmSend } from '@/app/_hooks/send/use-evm-send';

interface Props {
  amount: number;
  toAddress: string;
  setAmount: (amount: number) => void;
}

export const WithdrawEVM: React.FC<Props> = ({ amount, toAddress }) => {
  const {
    handleSubmit,
    isPending,
    isInvalid,
    ethBalance,
    statusText,
    isConfirmed,
  } = useEvmSend({
    address: toAddress,
    amount,
  });

  return (
    <>
      {ethBalance === 0 && (
        <p className="text-yellow-600 bg-yellow-600/10 p-2 rounded-md text-xs">
          Insufficient gas to pay for this transaction. Please add some ETH to
          your wallet.
        </p>
      )}
      <Button
        variant="turbo"
        disabled={isInvalid || isPending}
        onClick={handleSubmit}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isConfirmed ? (
          <Check className="size-4" />
        ) : null}
        {statusText}
      </Button>
    </>
  );
};
