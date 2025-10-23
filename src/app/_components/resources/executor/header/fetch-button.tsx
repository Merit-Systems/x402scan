import { useIsInitialized } from '@coinbase/cdp-hooks';
import { useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Wallet } from 'lucide-react';
import { formatTokenAmount } from '@/lib/token';
import { useResourceFetch } from '../contexts/fetch/hook';
import { WalletDialog } from '@/app/_components/wallet/dialog';
import { useSolana } from '@/app/_contexts/solana';

export const FetchButton = () => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();
  const { selectedAccount } = useSolana();
  const fetch = useResourceFetch();

  const isConnected = !!walletClient || !!selectedAccount;

  if (!isConnected || !fetch) {
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
        fetch.isPending ||
        !fetch.allRequiredFieldsFilled ||
        isLoadingWalletClient ||
        !isInitialized ||
        !isConnected
      }
      onClick={() => fetch.execute()}
    >
      {isLoadingWalletClient || !isInitialized || !isConnected ? (
        <Loader2 className="size-4 animate-spin" />
      ) : fetch.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Fetching
        </>
      ) : (
        <>
          <Play className="size-4" />
          Fetch
          <span>{formatTokenAmount(fetch.maxAmountRequired)}</span>
        </>
      )}
    </Button>
  );
};
