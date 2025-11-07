import { useWalletChain } from '@/app/_components/wallet/chain-context/hook';
import { Chain } from '@/types/chain';
import { NoSVMSessionContent } from './svm';
import { NoEVMSessionContent } from './evm';

export const UnauthedOnramp = () => {
  const { chain } = useWalletChain();

  if (chain === Chain.SOLANA) {
    return <NoSVMSessionContent />;
  }

  return <NoEVMSessionContent chain={chain} />;
};
