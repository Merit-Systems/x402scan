import { FetchEvm } from './evm';
import { FetchSvm } from './svm';

import { Chain } from '@/types/chain';

interface Props {
  chains: Chain[];
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit;
}

export const Fetch: React.FC<Props> = ({
  chains,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
}) => {
  if (chains.includes(Chain.SOLANA)) {
    return (
      <FetchSvm
        allRequiredFieldsFilled={allRequiredFieldsFilled}
        maxAmountRequired={maxAmountRequired}
        targetUrl={targetUrl}
        requestInit={requestInit}
      />
    );
  }
  return (
    <FetchEvm
      chain={Chain.BASE}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      maxAmountRequired={maxAmountRequired}
      targetUrl={targetUrl}
      requestInit={requestInit}
    />
  );
};
