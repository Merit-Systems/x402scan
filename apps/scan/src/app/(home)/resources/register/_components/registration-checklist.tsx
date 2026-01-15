import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';

interface RegistrationChecklistProps {
  methodUsed?: string;
  hasAccepts: boolean;
  hasOriginMetadata: boolean;
}

const Icon = ({ success }: { success: boolean }) =>
  success ? (
    <CheckCircle className="size-4 text-green-600" />
  ) : (
    <XCircle className="size-4 text-red-600" />
  );

export function RegistrationChecklist({
  methodUsed,
  hasAccepts,
  hasOriginMetadata,
}: RegistrationChecklistProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableHead>Check</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Connection info */}
          <TableRow>
            <TableCell
              colSpan={2}
              className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground font-medium py-1"
            >
              Connection
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>HTTP Method</TableCell>
            <TableCell>
              <span className="text-sm font-medium">{methodUsed}</span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Returns 402</TableCell>
            <TableCell>
              <Icon success={true} />
            </TableCell>
          </TableRow>

          {/* x402 validation */}
          <TableRow>
            <TableCell
              colSpan={2}
              className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground font-medium py-1 border-t"
            >
              x402 Validation
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Response parsed</TableCell>
            <TableCell>
              <Icon success={true} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Has accepts</TableCell>
            <TableCell>
              <Icon success={hasAccepts} />
            </TableCell>
          </TableRow>

          {/* Origin metadata */}
          <TableRow>
            <TableCell
              colSpan={2}
              className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground font-medium py-1 border-t"
            >
              Origin Metadata
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Metadata scraped</TableCell>
            <TableCell>
              <Icon success={hasOriginMetadata} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
