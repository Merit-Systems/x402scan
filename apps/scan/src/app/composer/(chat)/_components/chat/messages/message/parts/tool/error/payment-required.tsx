import { Button } from '@/components/ui/button';

import { Chain } from '@/app/_components/chains';

import type { RouterOutputs } from '@/trpc/client';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain, Chain as ChainType } from '@/types/chain';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

import { Deposit } from '@/app/composer/(chat)/_components/chat/input/wallet/content/deposit';

import { WalletChainProvider } from '@/app/_contexts/wallet-chain/provider';

import { formatCurrency } from '@/lib/utils';

interface Props {
  resource: RouterOutputs['public']['resources']['get'];
}

export const PaymentRequired: React.FC<Props> = ({ resource }) => {
  return (
    <div className="flex flex-col gap-2">
      {resource.accepts
        .filter(accept =>
          SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
        )
        .map(accept => (
          <AddFundsButton key={accept.network} accepts={accept} />
        ))}
    </div>
  );
};

const AddFundsButton = ({
  accepts,
}: {
  accepts: RouterOutputs['public']['resources']['get']['accepts'][number];
}) => {
  return (
    <WalletChainProvider
      initialChain={accepts.network as SupportedChain}
      isFixed
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Chain
              chain={accepts.network as ChainType}
              iconClassName="size-3"
            />
            Add Funds
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="bg-muted p-4 border-b">
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add at least{' '}
              <span className="font-bold">
                {formatCurrency(accepts.maxAmountRequired)}
              </span>{' '}
              to your wallet to call this tool.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-0 w-full max-w-full overflow-hidden">
            <Deposit />
          </div>
        </DialogContent>
      </Dialog>
    </WalletChainProvider>
  );
};
