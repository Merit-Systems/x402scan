import { FetchEvm } from './chains/evm';
import { FetchSvm } from './chains/svm';

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
    <div className="flex flex-col gap-2">
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
