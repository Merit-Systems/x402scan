import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { useSvmSend } from '@/app/_hooks/send/use-svm-send';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { SolanaAddress } from '@/types/address';

interface Props {
  amount: number;
  setAmount: (amount: number) => void;
  toAddress: string;
}

export const WithdrawSolana: React.FC<Props> = ({
  amount,
  setAmount,
  toAddress,
}) => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return <div>Connect your wallet to withdraw USDC</div>;
  }

  return (
    <WithdrawSolanaContent
      account={connectedWallet.account}
      amount={amount}
      setAmount={setAmount}
      toAddress={toAddress}
    />
  );
};

interface WithdrawContentProps extends Props {
  account: UiWalletAccount;
}

const WithdrawSolanaContent: React.FC<WithdrawContentProps> = ({
  account,
  amount,
  toAddress,
}) => {
  const { handleSubmit, isPending, isInvalid, statusText, isSent, solBalance } =
    useSvmSend({
      account,
      amount: amount,
      address: toAddress as SolanaAddress,
    });

  return (
    <>
      {solBalance === 0 && (
        <p className="text-yellow-600 bg-yellow-600/10 p-2 rounded-md text-xs">
          Insufficient SOL to pay for this transaction. Please add some SOL to
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
        ) : isSent ? (
          <Check className="size-4" />
        ) : null}
        {statusText}
      </Button>
    </>
  );
};
