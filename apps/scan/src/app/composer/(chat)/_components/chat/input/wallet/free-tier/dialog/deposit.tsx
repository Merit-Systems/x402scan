import { Deposit } from '@/app/composer/(chat)/_components/chat/input/wallet/server-wallet/content/deposit';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { api } from '@/trpc/client';

interface Props {
  setShowFreeTierDialog: () => void;
}

export const DepositFreeTierDialogContent: React.FC<Props> = ({
  setShowFreeTierDialog,
}) => {
  const { data: address, isLoading: isAddressLoading } =
    api.user.serverWallet.address.useQuery();

  return (
    <>
      <DialogHeader className="border-b bg-muted p-4">
        <DialogTitle>Add Funds</DialogTitle>
        <DialogDescription className="text-xs font-mono">
          Add funds to your x402 agent and use tools that exceed the free tier.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {isAddressLoading ? (
          <Skeleton className="w-full h-9" />
        ) : !address ? (
          <p className="text-muted-foreground text-xs font-mono">
            No address found.
          </p>
        ) : (
          <Deposit address={address} />
        )}
      </div>
      <div className="p-4 bg-muted border-t text-left flex gap-4">
        <p className="text-muted-foreground text-xs font-mono ">
          If you would like to continue using the free tier, you can close this
          dialog
        </p>
        <Button variant="outline" size="sm" onClick={setShowFreeTierDialog}>
          Back to Usage
        </Button>
      </div>
    </>
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
