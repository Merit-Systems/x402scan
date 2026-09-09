import { Chain } from "@/app/(app)/_components/chains";
import { useWalletChain } from "@/app/(app)/_contexts/wallet-chain/hook";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CHAIN_LABELS } from "@/types/chain";

export const ConnectInjectedWalletEmpty = () => {
  const { chain } = useWalletChain();

  return (
    <Empty className="w-full border border-solid bg-muted/80 p-2 md:p-4">
      <EmptyHeader className="gap-2">
        <EmptyMedia variant="icon" className="mb-0">
          <Chain chain={chain} iconClassName="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-sm">
          No {CHAIN_LABELS[chain]} Injected Wallets Detected
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
};
