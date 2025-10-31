import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { freeTierConfig } from '@/lib/free-tier';

interface Props {
  numMessages: number;
  numToolCalls: number;
  setShowDeposit: () => void;
}

export const FreeTierDialogContent: React.FC<Props> = ({
  numMessages,
  numToolCalls,
  setShowDeposit,
}) => {
  return (
    <>
      <DialogHeader className="border-b bg-muted p-4">
        <div className="flex flex-row items-center gap-2">
          <Logo className="size-4" />
          <DialogTitle>Sponsored x402 Usage</DialogTitle>
        </div>
        <DialogDescription className="text-xs font-mono">
          We are sponsoring your agent for {freeTierConfig.numMessages} messages
          and {freeTierConfig.numToolCalls} tool calls so you can try out x402
          inference and tools.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4">
        <ItemContainer
          label="Messages"
          value={`${numMessages} / ${freeTierConfig.numMessages} used`}
        />
        <ItemContainer
          label="Tool Calls"
          value={`${numToolCalls} / ${freeTierConfig.numToolCalls} used`}
          description={`Only tools under $${freeTierConfig.maxAmount} are eligible for sponsorship.`}
        />
      </div>
      <div className="p-4 bg-muted border-t text-left flex gap-4">
        <p className="text-muted-foreground text-xs font-mono ">
          If you would like to use tools over ${freeTierConfig.maxAmount}, you
          will need to add funds to your agent.
        </p>
        <Button variant="outline" size="sm" onClick={setShowDeposit}>
          Fund Agent
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
      <p className="text-sm font-medium font-mono">{label}</p>
      <p className="bg-muted rounded-md border p-2">{value}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
};
