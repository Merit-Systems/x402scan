import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { WalletButton } from '../button';
import { freeTierConfig } from '@/lib/free-tier';

interface Props {
  numMessages: number;
  numToolCalls: number;
}

export const FreeTierDialog: React.FC<Props> = ({
  numMessages,
  numToolCalls,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <WalletButton>
          <span>Sponsored</span>
        </WalletButton>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="border-b bg-muted p-4">
          <DialogTitle>Free x402 Credits</DialogTitle>
          <DialogDescription>
            We are sponsoring your agent for {freeTierConfig.numMessages}{' '}
            messages and {freeTierConfig.numToolCalls} tool calls.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 px-4 ">
          <ItemContainer
            label="Messages"
            value={`${numMessages} / ${freeTierConfig.numMessages} used`}
          />
          <ItemContainer
            label="Tool Calls"
            value={`${numToolCalls} / ${freeTierConfig.numToolCalls} used`}
          />
        </div>
        <p className="text-muted-foreground text-xs font-mono p-4 bg-muted border-t text-center">
          Use these credits to try out x402 inference and tools.
        </p>
      </DialogContent>
    </Dialog>
  );
};

const ItemContainer = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium font-mono">{label}</p>
      <p className="bg-muted rounded-md border p-2">{value}</p>
    </div>
  );
};
