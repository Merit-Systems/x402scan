import { useEffect } from 'react';

import { DepositTabsContent } from '../content';

import { useEvmNativeBalance } from '@/app/_hooks/balance/native/use-evm-balance';

import { DepositTab } from '../types';

import type { DepositTabsProps } from './types';

export const EvmDepositTabs: React.FC<DepositTabsProps> = ({
  chain,
  onSuccess,
  tab,
  setTab,
}) => {
  const { data: ethBalance } = useEvmNativeBalance({ chain });

  useEffect(() => {
    if (ethBalance !== undefined) {
      if (ethBalance > 0) {
        setTab(DepositTab.SEND);
      } else {
        setTab(DepositTab.ONRAMP);
      }
    }
  }, [ethBalance]);

  return (
    <DepositTabsContent
      tab={tab}
      setTab={setTab}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};
