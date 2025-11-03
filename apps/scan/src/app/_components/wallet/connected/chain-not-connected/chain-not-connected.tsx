import { useWalletChain } from '../../chain-context/hook';

import { SVMNotConnected } from './svm';
import { EVMNotConnected } from './evm';

import { Chain, CHAIN_ICONS, CHAIN_LABELS } from '@/types/chain';
import Image from 'next/image';

export const ChainNotConnected = () => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Image
        src={CHAIN_ICONS[chain]}
        alt={CHAIN_LABELS[chain]}
        width={64}
        height={64}
        className="size-8"
      />
      <p className="text-sm font-medium">
        No {CHAIN_LABELS[chain]} Wallet Connected
      </p>
      {chain === Chain.SOLANA ? <SVMNotConnected /> : <EVMNotConnected />}
    </div>
  );
};
