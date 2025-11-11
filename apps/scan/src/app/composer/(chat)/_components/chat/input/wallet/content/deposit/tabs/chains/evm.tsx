import { useEffect } from 'react';

import { DepositTabsContent } from '../content';

import { useEvmNativeBalance } from '@/app/_hooks/balance/native/use-evm-balance';

import { DepositTab } from '../types';

import type { DepositTabsProps } from './types';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';

export const EvmDepositTabs: React.FC<DepositTabsProps> = ({
  chain,
  onSuccess,
  tab,
  setTab,
}) => {
  const { evmAddress } = useConnectedWallets();

  const { data: ethBalance } = useEvmNativeBalance({ chain });

  useEffect(() => {
    if ((ethBalance !== undefined && ethBalance === 0) || !evmAddress) {
      setTab(DepositTab.ONRAMP);
    }
  }, [ethBalance, evmAddress, setTab]);

  return (
    <DepositTabsContent
      tab={tab}
      setTab={setTab}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};
