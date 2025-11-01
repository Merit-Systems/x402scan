import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { WalletButton } from '../../button';
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
