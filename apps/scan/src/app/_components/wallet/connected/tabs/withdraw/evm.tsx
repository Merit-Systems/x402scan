import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useEvmSend } from '@/app/_hooks/send/use-evm-send';

interface Props {
  amount: number;
  toAddress: string;
  onSuccess: () => void;
}

export const WithdrawEVM: React.FC<Props> = ({
  amount,
  toAddress,
  onSuccess,
}) => {
  const { handleSubmit, isPending, isInvalid, statusText, isSent } = useEvmSend(
    {
      address: toAddress,
      amount,
      onSuccess,
    }
  );

  return (
    <Button
      variant="turbo"
      disabled={isInvalid || isPending}
      onClick={handleSubmit}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSent ? (
        <Check className="size-4" />
      ) : null}
      {statusText}
    </Button>
  );
};
