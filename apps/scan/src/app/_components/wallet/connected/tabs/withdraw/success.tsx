import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Props {
  amount: number;
  toAddress: string;
  onReset: () => void;
}

export const WithdrawSuccess: React.FC<Props> = ({
  amount,
  toAddress,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <CheckCircle className="size-10 text-green-600" />
      <p className="text-center">
        You have successfully sent{' '}
        <span className="font-bold">{amount} USDC</span> to{' '}
        <span className="font-bold">{formatAddress(toAddress)}</span>
      </p>
      <Button onClick={onReset}>Send Again</Button>
    </div>
  );
};
