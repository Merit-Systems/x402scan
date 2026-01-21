import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useSolanaWallet } from '@/app/(app)/_contexts/solana/hook';

import { useSvmSend } from '@/app/(app)/_hooks/send/use-svm-send';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { SolanaAddress } from '@/types/address';

interface Props {
  amount: number;
  toAddress: string;
  onSuccess: () => void;
}

export const WithdrawSolana: React.FC<Props> = ({
  amount,
  toAddress,
  onSuccess,
}) => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return <div>Connect your wallet to withdraw USDC</div>;
  }

  return (
    <WithdrawSolanaContent
      account={connectedWallet.account}
      amount={amount}
      onSuccess={onSuccess}
      toAddress={toAddress}
    />
  );
};

type WithdrawContentProps = {
  account: UiWalletAccount;
} & Props;

const WithdrawSolanaContent: React.FC<WithdrawContentProps> = ({
  account,
  amount,
  toAddress,
  onSuccess,
}) => {
  const { handleSubmit, isPending, isInvalid, statusText, isSent } = useSvmSend(
    {
      account,
      amount: amount,
      address: toAddress as SolanaAddress,
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
