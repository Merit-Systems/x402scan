import { Separator } from '@/components/ui/separator';

import { Send } from './send';
import { Onramp } from './onramp';

import type { Address } from 'viem';
import { useWalletChain } from '../../chain-context/hook';
import { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';
import { Chain } from '@/types/chain';

interface Props {
  connectedWallets: ConnectedWallets;
}

export const Deposit: React.FC<Props> = ({ connectedWallets }) => {
  const { chain } = useWalletChain();

  if (chain === Chain.SOLANA) {
    if (connectedWallets.solanaAddress) {
      return <DepositContent address={connectedWallets.solanaAddress} />;
    }
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">No Solana address found</p>
      </div>
    );
  }

  if (connectedWallets.evmAddress) {
    return <DepositContent address={connectedWallets.evmAddress} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">No EVM address found</p>
    </div>
  );
};

const DepositContent = ({ address }: { address: string }) => {
  return (
    <div className="flex flex-col gap-4">
      <Send address={address} />
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <p className="text-muted-foreground text-xs">or</p>
        <Separator className="flex-1" />
      </div>
      <Onramp />
    </div>
  );
};
