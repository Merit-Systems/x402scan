import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTokenAmount } from '@/lib/token';
import { formatCompactAgo } from '@/lib/utils';
import type { RouterOutputs } from '@/trpc/client';
import { Info } from 'lucide-react';

interface Props {
  transaction: NonNullable<RouterOutputs['transactions']['get']>;
  transfer: NonNullable<RouterOutputs['transfers']['get']>;
}

export const TransactionDetails: React.FC<Props> = ({
  transaction,
  transfer,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Full Details</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row
          label="Amount"
          value={
            <p className="font-bold text-primary">
              {formatTokenAmount(transfer.amount)}
            </p>
          }
        />
        <Row
          label="Timestamp"
          value={formatCompactAgo(transaction.timestamp)}
        />
        <Row
          label="Transaction Hash"
          value={<p className="font-mono">{transaction.transaction_hash}</p>}
        />
        <Row
          label="Sender"
          value={<p className="font-mono">{transfer.sender}</p>}
        />
        <Row
          label="Recipient"
          value={<p className="font-mono">{transfer.recipient}</p>}
        />
        <Row
          label="Token Address"
          value={<p className="font-mono">{transaction.to_address}</p>}
        />
        <Row
          label="Block Number"
          value={<p className="font-mono">{transaction.block_number}</p>}
        />
        <Row
          label="Transaction Index"
          value={<p className="font-mono">{transaction.transaction_index}</p>}
        />
        <Row
          label="Gas"
          value={<p className="font-mono">{transaction.gas}</p>}
        />
        <Row
          label="Gas Price"
          value={<p className="font-mono">{transaction.gas_price} WEI</p>}
        />
      </CardContent>
    </Card>
  );
};

interface RowProps {
  label: string;
  tooltip?: string;
  value: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, tooltip, value }) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 py-2 first:pt-0 last:pb-0 md:items-center">
      <div className="flex items-center gap-2">
        <p className="w-full md:w-80 text-sm">{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3 text-muted-foreground/60" />
            </TooltipTrigger>
          </Tooltip>
        )}
      </div>
      <div className="flex-1 text-sm">{value}</div>
    </div>
  );
};
