import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { BASE_USDC, usdc } from '@/lib/tokens/usdc';

import { useEvmSend } from '@/app/_hooks/send/use-evm-send';
import { api } from '@/trpc/client';
import { SupportedChain } from '@/types/chain';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';
import { ChainNotConnected } from '@/app/_components/wallet/connected/chain-not-connected';

interface Props {
  amount: number;
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const SendToServerWalletEVM: React.FC<Props> = ({
  amount,
  chain,
  onSuccess,
}) => {
  const { evmAddress } = useConnectedWallets();

  if (!evmAddress) {
    return <ChainNotConnected />;
  }

  return (
    <SendToServerWalletEVMContent
      amount={amount}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};

const SendToServerWalletEVMContent: React.FC<Props> = ({
  amount,
  chain,
  onSuccess,
}) => {
  const utils = api.useUtils();

  const { data: serverWalletAddress, isLoading: isServerWalletAddressLoading } =
    api.user.serverWallet.address.useQuery();

  const {
    handleSubmit,
    isPending,
    isInvalid,
    ethBalance,
    statusText,
    isConfirmed,
  } = useEvmSend({
    token: usdc(chain),
    address: serverWalletAddress!,
    amount,
    onSuccess: () => {
      void utils.user.serverWallet.usdcBaseBalance.invalidate();
      onSuccess?.();
    },
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
        disabled={
          isInvalid ||
          isPending ||
          isServerWalletAddressLoading ||
          !serverWalletAddress
        }
        onClick={handleSubmit}
      >
        {isPending || isServerWalletAddressLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isConfirmed ? (
          <Check className="size-4" />
        ) : null}
        {statusText}
      </Button>
    </>
  );
};
