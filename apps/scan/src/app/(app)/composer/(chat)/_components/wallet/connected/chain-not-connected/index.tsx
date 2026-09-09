import { Chain } from "@/app/(app)/_components/chains";
import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";
import { Chain as ChainType, CHAIN_LABELS } from "@/types/chain";

import { EVMNotConnected } from "./evm";
import { SVMNotConnected } from "./svm";

export const ChainNotConnected = () => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Chain chain={chain} iconClassName="size-8" />
      <p className="type-supporting-body type-emphasis">
        No {CHAIN_LABELS[chain]} Wallet Connected
      </p>
      {chain === ChainType.SOLANA ? <SVMNotConnected /> : <EVMNotConnected />}
    </div>
  );
};
