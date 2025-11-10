import { useState } from 'react';

import { ServerWalletAddress } from '../../address';

import { Chain, type SupportedChain } from '@/types/chain';
import { SvmDepositTabs } from './chains/svm';
import { EvmDepositTabs } from './chains/evm';
import { DepositTab } from './types';

interface Props {
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const DepositTabs: React.FC<Props> = ({ chain, onSuccess }) => {
  const [tab, setTab] = useState<DepositTab>(DepositTab.SEND);

  if (chain === Chain.SOLANA) {
    return (
      <SvmDepositTabs
        chain={chain}
        onSuccess={onSuccess}
        tab={tab}
        setTab={setTab}
      />
    );
  }

  return (
    <EvmDepositTabs
      chain={chain}
      onSuccess={onSuccess}
      tab={tab}
      setTab={setTab}
    />
  );
};
