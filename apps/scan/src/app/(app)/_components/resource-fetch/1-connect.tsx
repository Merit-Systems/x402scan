import React from 'react';

import { Button } from '@/components/ui/button';

import { WalletDialog } from '@/app/(app)/_components/wallet/dialog';
import { Chain } from '@/app/(app)/_components/chains';

import type { SupportedChain } from '@/types/chain';

interface Props {
  chain: SupportedChain;
}

export const ConnectWalletState: React.FC<Props> = ({ chain }) => {
  return (
    <WalletDialog initialChain={chain} isFixed>
      <Button variant="outline" size="lg" className="w-full">
        <Chain chain={chain} />
        Connect Wallet
      </Button>
    </WalletDialog>
  );
};
