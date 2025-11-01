import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle, XCircle } from 'lucide-react';
import { CHAIN_LABELS, type Chain } from '@/types/chain';

type AcceptStatus = {
  network: string;
  payTo: string;
  description?: string;
  asset?: string;
  isSupported: boolean;
};

export function AcceptsBreakdownTable({
  accepts,
}: {
  accepts: AcceptStatus[];
}) {
  if (accepts.length === 0) {
    return null;
  }

  // Helper to format network names (convert base_sepolia -> Base Sepolia)
  const formatNetworkName = (network: string): string => {
    // Check if it's a known chain first
    const chainKey = network.toLowerCase() as Chain;
    if (CHAIN_LABELS[chainKey]) {
      return CHAIN_LABELS[chainKey];
    }
    // Fallback: capitalize and replace underscores
    return network
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[120px] font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Network</TableHead>
            <TableHead className="font-semibold">Address</TableHead>
            <TableHead className="font-semibold">Asset</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accepts.map((accept, index) => (
            <TableRow key={index} className="hover:bg-muted/30">
              <TableCell className="py-3">
                {accept.isSupported ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <CheckCircle className="size-4 shrink-0" />
                    <span className="text-xs font-medium">Registered</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                    <XCircle className="size-4 shrink-0" />
                    <span className="text-xs font-medium">Filtered</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium py-3">
                {formatNetworkName(accept.network)}
              </TableCell>
              <TableCell className="font-mono text-xs py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {accept.payTo.length > 20
                        ? `${accept.payTo.slice(0, 10)}...${accept.payTo.slice(-8)}`
                        : accept.payTo}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{accept.payTo}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="font-mono text-xs py-3 max-w-[200px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help truncate block">
                      {accept.asset}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs max-w-xs break-all">
                      {accept.asset}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
