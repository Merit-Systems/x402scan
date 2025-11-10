import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { useSvmSend } from '@/app/_hooks/send/use-svm-send';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { SolanaAddress } from '@/types/address';
import { ChainNotConnected } from '@/app/_components/wallet/connected/chain-not-connected';

interface Props {
  amount: number;
  onSuccess?: () => void;
}

export const SendToServerWalletSolana: React.FC<Props> = ({
  amount,
  onSuccess,
}) => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return <ChainNotConnected />;
  }

  return (
    <WithdrawSolanaContent
      account={connectedWallet.account}
      amount={amount}
      onSuccess={onSuccess}
    />
  );
};

interface WithdrawContentProps extends Props {
  account: UiWalletAccount;
}

const WithdrawSolanaContent: React.FC<WithdrawContentProps> = ({
  account,
  amount,
  onSuccess,
}) => {
  const { handleSubmit, isPending, isInvalid, statusText, isSent, solBalance } =
    useSvmSend({
      account,
      amount: amount,
      address: 'server-wallet' as SolanaAddress,
      onSuccess,
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
