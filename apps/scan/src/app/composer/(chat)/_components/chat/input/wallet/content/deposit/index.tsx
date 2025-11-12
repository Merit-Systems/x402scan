import { ServerWalletAddress } from '../address';
import { DepositTabs } from './tabs';

import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

interface Props {
  onSuccess?: () => void;
}

export const Deposit: React.FC<Props> = ({ onSuccess }) => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col gap-4">
      <ServerWalletAddress chain={chain} />
      <DepositTabs chain={chain} onSuccess={onSuccess} />
    </div>
  );
};
