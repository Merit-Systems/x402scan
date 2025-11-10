import { useEffect } from 'react';

import { DepositTabsContent } from '../content';

import { DepositTab } from '../types';

import type { DepositTabsProps } from './types';
import { Chain } from '@/types/chain';
import { useSolanaNativeBalance } from '@/app/_hooks/balance/native/use-svm-balance';

export const SvmDepositTabs: React.FC<DepositTabsProps<Chain.SOLANA>> = ({
  chain,
  onSuccess,
  tab,
  setTab,
}) => {
  const { data: solBalance } = useSolanaNativeBalance();

  useEffect(() => {
    if (solBalance !== undefined) {
      if (solBalance > 0) {
        setTab(DepositTab.SEND);
      } else {
        setTab(DepositTab.ONRAMP);
      }
    }
  }, [solBalance]);

  return (
    <DepositTabsContent
      tab={tab}
      setTab={setTab}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};
