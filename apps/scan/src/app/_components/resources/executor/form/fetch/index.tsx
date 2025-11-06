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
  return (
    <div>
      {chains.map(chain =>
        chain === Chain.SOLANA ? (
          <FetchSvm
            key={chain}
            allRequiredFieldsFilled={allRequiredFieldsFilled}
            maxAmountRequired={maxAmountRequired}
            targetUrl={targetUrl}
            requestInit={requestInit}
          />
        ) : (
          <FetchEvm
            key={chain}
            chain={chain}
            allRequiredFieldsFilled={allRequiredFieldsFilled}
            maxAmountRequired={maxAmountRequired}
            targetUrl={targetUrl}
            requestInit={requestInit}
          />
        )
      )}
    </div>
  );
};
