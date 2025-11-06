import { WalletDialog } from '@/app/_components/wallet/dialog';

import { X402FetchResult } from './result';
import { ConnectWalletButton, FetchButton } from './button';

import { useSvmX402Fetch } from '@/app/_hooks/x402/svm';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { Chain } from '@/types/chain';

import type { UiWalletAccount } from '@wallet-standard/react';

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

  if (!connectedWallet) {
    return (
      <WalletDialog chain={Chain.SOLANA}>
        <ConnectWalletButton chain={Chain.SOLANA} />
      </WalletDialog>
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

  return (
    <>
      <FetchButton
        isPending={isPending}
        allRequiredFieldsFilled={allRequiredFieldsFilled}
        execute={execute}
        isLoading={false}
        chains={[Chain.SOLANA]}
        maxAmountRequired={maxAmountRequired}
      />
      <X402FetchResult error={error} response={response} />
    </>
  );
};
