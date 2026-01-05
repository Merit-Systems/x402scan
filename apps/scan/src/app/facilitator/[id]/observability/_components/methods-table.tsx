'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useObservabilityDataParams } from './use-observability-data';
import { api } from '@/trpc/client';

type Props = {
  facilitatorName: string;
};

export const MethodsTable: React.FC<Props> = ({ facilitatorName }) => {
  const params = useObservabilityDataParams();
  const { data, isLoading } =
    api.public.facilitatorObservability.methods.useQuery({
      facilitatorName,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Methods</h2>
        <p className="text-sm text-muted-foreground">
          All facilitator API methods invoked during this time range
        </p>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Method</TableHead>
              <TableHead className="text-right w-[20%]">Requests</TableHead>
              <TableHead className="text-right w-[20%]">Errors</TableHead>
              <TableHead className="text-right w-[15%]">Avg Duration</TableHead>
              <TableHead className="text-right w-[15%]">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No methods found
                </TableCell>
              </TableRow>
            ) : (
              data.map((method, index) => {
                const avgDuration = method.avg_duration
                  ? (parseFloat(method.avg_duration) / 1000).toFixed(3)
                  : 'N/A';
                const errorCount = parseInt(method.error_count);

                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {method.method}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseInt(method.total_requests).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {errorCount > 0 ? (
                        <span className="text-destructive">
                          {errorCount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {avgDuration !== 'N/A' ? `${avgDuration}s` : avgDuration}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(method.last_seen + 'Z'), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
