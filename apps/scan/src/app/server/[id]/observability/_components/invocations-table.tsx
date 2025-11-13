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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '@/trpc/client';
import { useObservabilityDataParams } from './use-observability-data';

interface Props {
  resourceUrl: string;
}

export const InvocationsTable: React.FC<Props> = ({ resourceUrl }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const params = useObservabilityDataParams();

  const { data, isLoading } = api.public.observability.invocations.useQuery({
    resourceUrl,
    startDate: params.startDate,
    endDate: params.endDate,
    page: currentPage,
    pageSize: 50,
    statusFilter: '5xx',
  });

  const getStatusColor = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600';
    if (statusCode >= 500) return 'text-red-600';
    return '';
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const parseResponseBody = (body: string): string => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Server Errors (5xx)</h2>
        <p className="text-sm text-muted-foreground">
          All 5xx errors for this resource ({data?.total.toLocaleString() ?? 0}{' '}
          total)
        </p>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]"></TableHead>
              <TableHead className="w-[10%]">Method</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="text-right w-[15%]">Duration</TableHead>
              <TableHead className="w-[20%]">Request Type</TableHead>
              <TableHead className="w-[15%]">Response Type</TableHead>
              <TableHead className="text-right w-[25%]">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No invocations found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map(invocation => {
                const isExpanded = expandedRows.has(invocation.id);
                return (
                  <>
                    <TableRow key={invocation.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(invocation.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {invocation.method}
                      </TableCell>
                      <TableCell
                        className={`font-mono text-xs font-semibold ${getStatusColor(invocation.status_code)}`}
                      >
                        {invocation.status_code}
                      </TableCell>
                      <TableCell className="text-right">
                        {(invocation.duration / 1000).toFixed(2)}s
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate">
                        {invocation.request_content_type || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate">
                        {invocation.response_content_type || '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(invocation.created_at + 'Z'),
                          {
                            addSuffix: true,
                          }
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50 p-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">
                              Response Body
                            </h4>
                            <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto border">
                              {parseResponseBody(invocation.response_body)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(p => Math.min(data.totalPages, p + 1))
              }
              disabled={currentPage === data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
