import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { SVMNotConnected } from '@/app/_components/wallet/connected/chain-not-connected/svm';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { useSvmSend } from '@/app/_hooks/send/use-svm-send';

import { api } from '@/trpc/client';

import { Chain } from '@/types/chain';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { SolanaAddress } from '@/types/address';

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
    return <SVMNotConnected />;
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
  const { data: serverWalletAddress, isLoading: isServerWalletAddressLoading } =
    api.user.serverWallet.address.useQuery({
      chain: Chain.SOLANA,
    });

  const { handleSubmit, isPending, isInvalid, statusText, isSent } = useSvmSend(
    {
      account,
      amount: amount,
      address: serverWalletAddress as SolanaAddress | undefined,
      onSuccess,
    }
  );

  return (
    <Button
      variant="turbo"
      disabled={
        isInvalid ||
        isPending ||
        isServerWalletAddressLoading ||
        !serverWalletAddress
      }
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
