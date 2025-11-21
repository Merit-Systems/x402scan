import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';

import { useSvmX402Fetch } from '@/app/_hooks/x402/svm';
import { useSPLTokenBalance } from '@/app/_hooks/balance/token/use-svm-token-balance';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { SupportedChain } from '@/types/chain';
import { Chain } from '@/types/chain';

import { convertTokenAmount } from '@/lib/token';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';

interface Props<TData = unknown> {
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit | ((chain: SupportedChain) => RequestInit);
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
  text?: string;
  skipTracking?: boolean;
}

export const FetchSvm: React.FC<Props> = ({
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
  skipTracking = false,
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
      options={options}
      isTool={isTool}
      text={text}
      skipTracking={skipTracking}
    />
  );
};

interface FetchContentProps extends Omit<Props, 'chain'> {
  account: UiWalletAccount;
  isTool?: boolean;
}

const FetchContent: React.FC<FetchContentProps> = ({
  account,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
  skipTracking = false,
}) => {
  const { mutate: execute, isPending } = useSvmX402Fetch({
    account,
    targetUrl,
    value: maxAmountRequired,
    init:
      typeof requestInit === 'function'
        ? requestInit(Chain.SOLANA)
        : requestInit,
    options,
    isTool,
    skipTracking,
  });
  const { isInitialized } = useIsInitialized();

  return (
    <FetchState
      isPending={isPending}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      execute={execute}
      isLoading={!isInitialized}
      chains={[Chain.SOLANA]}
      maxAmountRequired={maxAmountRequired}
      text={text}
    />
  );
};
