import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";
import { Chain } from "@/types/chain";

import { NoEVMSessionContent } from "./evm";
import { NoSVMSessionContent } from "./svm";

export const UnauthedOnramp = () => {
  const { chain } = useWalletChain();

  if (chain === Chain.SOLANA) {
    return <NoSVMSessionContent />;
  }

  return <NoEVMSessionContent chain={chain} />;
};
