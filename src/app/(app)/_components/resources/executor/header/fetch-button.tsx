import { useIsInitialized } from '@coinbase/cdp-hooks';
import { useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Wallet } from 'lucide-react';
import { formatTokenAmount } from '@/lib/token';
import { useResourceFetch } from '../contexts/fetch/hook';
import { WalletDialog } from '@/app/(app)/_components/wallet/dialog';

export const FetchButton = () => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const { execute, isPending, allRequiredFieldsFilled, maxAmountRequired } =
    useResourceFetch();

  if (!walletClient) {
    return (
      <WalletDialog>
        <Button variant="ghost" size="sm" className="size-fit p-0 md:px-1">
          <Wallet className="size-4" />
          Connect Wallet
        </Button>
      </WalletDialog>
    );
  }

  return (
    <Button
      variant="primaryGhost"
      size="sm"
      className="size-fit p-0 md:px-1"
      disabled={
        isPending ||
        !allRequiredFieldsFilled ||
        isLoadingWalletClient ||
        !isInitialized ||
        !walletClient
      }
      onClick={() => execute()}
    >
      {isLoadingWalletClient || !isInitialized || !walletClient ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Fetching
        </>
      ) : (
        <>
          <Play className="size-4" />
          Fetch
          <span>{formatTokenAmount(maxAmountRequired)}</span>
        </>
      )}
    </Button>
  );
};
