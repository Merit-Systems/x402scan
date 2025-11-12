import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Wallet } from 'lucide-react';

export const ConnectInjectedWalletEmpty = () => {
  return (
    <Empty className=" bg-muted/80 w-full p-2 md:p-4">
      <EmptyHeader className="gap-2">
        <EmptyMedia variant="icon" className="mb-0">
          <Wallet />
        </EmptyMedia>
        <EmptyTitle className="text-sm">
          No Injected Wallets Detected
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
};
