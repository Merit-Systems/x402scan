import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { WalletButton } from '../../button';
import { freeTierConfig } from '@/lib/free-tier';
import { useState } from 'react';
import { FreeTierDialogContent } from './free-tier';
import { DepositFreeTierDialogContent } from './deposit';

interface Props {
  numMessages: number;
  numToolCalls: number;
}

export const FreeTierDialog: React.FC<Props> = ({
  numMessages,
  numToolCalls,
}) => {
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <WalletButton>
          <span>Sponsored</span>
        </WalletButton>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden">
        {showDeposit ? (
          <DepositFreeTierDialogContent
            setShowFreeTierDialog={() => setShowDeposit(false)}
          />
        ) : (
          <FreeTierDialogContent
            numMessages={numMessages}
            numToolCalls={numToolCalls}
            setShowDeposit={() => setShowDeposit(true)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ItemContainerProps {
  label: string;
  value: string;
  description?: string;
}

const ItemContainer: React.FC<ItemContainerProps> = ({
  label,
  value,
  description,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="bg-muted rounded-md border p-2 font-mono">{value}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
};
