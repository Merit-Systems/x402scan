import { useWalletChain } from '../../../../_contexts/wallet-chain/hook';

import { SVMNotConnected } from './svm';
import { EVMNotConnected } from './evm';

import { Chain as ChainType, CHAIN_LABELS } from '@/types/chain';
import { Chain } from '@/app/(app)/_components/chains';

export const ChainNotConnected = () => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Chain chain={chain} iconClassName="size-8" />
      <p className="text-sm font-medium">
        No {CHAIN_LABELS[chain]} Wallet Connected
      </p>
      {chain === ChainType.SOLANA ? <SVMNotConnected /> : <EVMNotConnected />}
    </div>
  );
};
