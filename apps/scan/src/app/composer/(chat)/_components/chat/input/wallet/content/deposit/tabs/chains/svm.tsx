import { useEffect } from 'react';

import { DepositTabsContent } from '../content';

import { DepositTab } from '../types';

import { useSolanaNativeBalance } from '@/app/_hooks/balance/native/use-svm-balance';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';

import type { Chain } from '@/types/chain';
import type { DepositTabsProps } from './types';

export const SvmDepositTabs: React.FC<DepositTabsProps<Chain.SOLANA>> = ({
  chain,
  onSuccess,
  tab,
  setTab,
}) => {
  const { solanaAddress } = useConnectedWallets();
  const { data: solBalance } = useSolanaNativeBalance();

  useEffect(() => {
    if ((solBalance !== undefined && solBalance === 0) || !solanaAddress) {
      setTab(DepositTab.ONRAMP);
    }
  }, [solBalance, solanaAddress, setTab]);

  return (
    <DepositTabsContent
      tab={tab}
      setTab={setTab}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};
