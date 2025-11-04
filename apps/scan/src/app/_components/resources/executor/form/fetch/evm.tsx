import { useWalletClient } from 'wagmi';

import { useIsInitialized } from '@coinbase/cdp-hooks';

import { WalletDialog } from '@/app/_components/wallet/dialog';

import { X402FetchResult } from './result';
import { ConnectWalletButton, FetchButton } from './button';

import { useEvmX402Fetch } from '@/app/_hooks/x402/evm';

import type { Chain } from '@/types/chain';

interface Props {
  chain: Chain;
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit;
}

export const FetchEvm: React.FC<Props> = ({
  chain,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
}) => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const {
    data: response,
    mutate: execute,
    isPending,
    error,
  } = useEvmX402Fetch(targetUrl, maxAmountRequired, chain, requestInit);

  if (!walletClient) {
    return (
      <WalletDialog initialChain={chain}>
        <ConnectWalletButton chains={[chain]} />
      </WalletDialog>
    );
  }

  return (
    <>
      <FetchButton
        isPending={isPending}
        allRequiredFieldsFilled={allRequiredFieldsFilled}
        execute={execute}
        isLoading={isLoadingWalletClient || !isInitialized}
        chains={[chain]}
        maxAmountRequired={maxAmountRequired}
      />
      <X402FetchResult error={error} response={response} />
    </>
  );
};
