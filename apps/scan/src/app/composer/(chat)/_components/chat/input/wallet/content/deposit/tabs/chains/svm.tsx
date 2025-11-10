import { useEffect } from 'react';

import { DepositTabsContent } from '../content';

import { DepositTab } from '../types';

import type { DepositTabsProps } from './types';
import { Chain } from '@/types/chain';
import { useSolanaNativeBalance } from '@/app/_hooks/balance/native/use-svm-balance';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';

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
  }, [solBalance, solanaAddress]);

  return (
    <DepositTabsContent
      tab={tab}
      setTab={setTab}
      chain={chain}
      onSuccess={onSuccess}
    />
  );
};
