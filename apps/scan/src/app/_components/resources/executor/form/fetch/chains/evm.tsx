import { useWalletClient } from 'wagmi';

import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../states/1-connect';
import { LoadingState } from '../states/2-loading-balance';
import { AddFundsState } from '../states/3-add-funds';
import { FetchState } from '../states/4-fetch';

import { useBalance } from '@/app/_hooks/balance/use-evm-balance';
import { useEvmX402Fetch } from '@/app/_hooks/x402/evm';

import type { Chain } from '@/types/chain';
import { convertTokenAmount } from '@/lib/token';

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

  const { data: balance, isLoading: isLoadingBalance } = useBalance();

  if (!walletClient) {
    return <ConnectWalletState chain={chain} />;
  }

  if (isLoadingBalance) {
    return <LoadingState chain={chain} maxAmountRequired={maxAmountRequired} />;
  }

  if (!balance || balance < convertTokenAmount(maxAmountRequired)) {
    return (
      <AddFundsState chain={chain} maxAmountRequired={maxAmountRequired} />
    );
  }

  return (
    <FetchState
      isPending={isPending}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      execute={execute}
      isLoading={isLoadingWalletClient || !isInitialized}
      chains={[chain]}
      maxAmountRequired={maxAmountRequired}
      error={error}
      response={response}
    />
  );
};
