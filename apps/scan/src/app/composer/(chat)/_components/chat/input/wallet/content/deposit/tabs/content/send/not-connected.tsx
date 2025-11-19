import { EVMNotConnected } from '@/app/_components/wallet/connected/chain-not-connected/evm';
import { SVMNotConnected } from '@/app/_components/wallet/connected/chain-not-connected/svm';

import { Chain, CHAIN_LABELS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';

interface Props {
  chain: SupportedChain;
}

export const SendNotConnected: React.FC<Props> = ({ chain }) => {
  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <p className="text-sm font-medium">
        Connect a {CHAIN_LABELS[chain]} wallet to send USDC
      </p>
      {chain === Chain.SOLANA ? <SVMNotConnected /> : <EVMNotConnected />}
    </div>
  );
};
