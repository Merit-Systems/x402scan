import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';

import { useSvmX402Fetch } from '@/app/_hooks/x402/svm';
import { useSPLTokenBalance } from '@/app/_hooks/balance/use-svm-balance';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { Chain } from '@/types/chain';

import { convertTokenAmount } from '@/lib/token';

import type { UiWalletAccount } from '@wallet-standard/react';
import { useIsInitialized } from '@coinbase/cdp-hooks';

interface Props {
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit;
}

export const FetchSvm: React.FC<Props> = ({
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
}) => {
  const { connectedWallet } = useSolanaWallet();

  const { data: balance, isLoading: isLoadingBalance } = useSPLTokenBalance();

  if (!connectedWallet) {
    return <ConnectWalletState chain={Chain.SOLANA} />;
  }

  if (isLoadingBalance) {
    return (
      <LoadingState
        chain={Chain.SOLANA}
        maxAmountRequired={maxAmountRequired}
      />
    );
  }

  if (!balance || balance < convertTokenAmount(maxAmountRequired)) {
    return (
      <AddFundsState
        chain={Chain.SOLANA}
        maxAmountRequired={maxAmountRequired}
      />
    );
  }

  return (
    <FetchContent
      account={connectedWallet.account}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      maxAmountRequired={maxAmountRequired}
      targetUrl={targetUrl}
      requestInit={requestInit}
    />
  );
};

interface FetchContentProps extends Omit<Props, 'chain'> {
  account: UiWalletAccount;
}

const FetchContent: React.FC<FetchContentProps> = ({
  account,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
}) => {
  const {
    data: response,
    mutate: execute,
    isPending,
    error,
  } = useSvmX402Fetch(targetUrl, maxAmountRequired, account, requestInit);
  const { isInitialized } = useIsInitialized();

  return (
    <FetchState
      isPending={isPending}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      execute={execute}
      isLoading={!isInitialized}
      chains={[Chain.SOLANA]}
      maxAmountRequired={maxAmountRequired}
      error={error}
      response={response}
    />
  );
};
