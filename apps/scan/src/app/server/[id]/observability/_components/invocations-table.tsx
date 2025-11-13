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
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { useEffect, useMemo, useState } from 'react';
import { subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InvocationData {
  id: string;
  url: string;
  method: string;
  status_code: number;
  status_text: string;
  duration: number;
  created_at: string;
  request_content_type: string;
  response_content_type: string;
  response_body: string;
}

interface PaginatedResponse {
  data: InvocationData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Props {
  resourceUrl: string;
}

const INVOCATIONS_ENDPOINT = '/api/observability/invocations';

export const InvocationsTable: React.FC<Props> = ({ resourceUrl }) => {
  const { timeframe } = useTimeRangeContext();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = subDays(now, Number(timeframe));
    return { startDate: start, endDate: now };
  }, [timeframe]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(INVOCATIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceUrl,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            page: currentPage,
            pageSize: 50,
            statusFilter: '5xx',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invocations');
        }

        const result = (await response.json()) as PaginatedResponse;
        setData(result);
      } catch (error) {
        console.error('Error fetching invocations:', error);
        setData({
          data: [],
          total: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [startDate, endDate, resourceUrl, currentPage]);

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
            {!data || data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No invocations found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(invocation => {
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
                        {formatDistanceToNow(new Date(invocation.created_at), {
                          addSuffix: true,
                        })}
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
                              {JSON.stringify(
                                JSON.parse(invocation.response_body),
                                null,
                                2
                              )}
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

      {data && data.totalPages > 1 && (
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
