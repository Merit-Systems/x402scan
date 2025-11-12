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
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { Skeleton } from '@/components/ui/skeleton';

interface ResourceData {
  url: string;
  total_requests: string;
  error_count: string;
  avg_duration: string;
  last_seen: string;
}

interface Props {
  originUrl: string;
}

const LoadingResourcesTable = () => {
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
};

export const ResourcesTable: React.FC<Props> = ({ originUrl }) => {
  const { startDate, endDate } = useTimeRangeContext();
  const [data, setData] = useState<ResourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/observability/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originUrl,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch resources data');
        }

        const result = (await response.json()) as ResourceData[];
        setData(result);
      } catch (error) {
        console.error('Error fetching resources data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [startDate, endDate, originUrl]);

  if (isLoading) {
    return <LoadingResourcesTable />;
  }

  return <ResourcesTableInner data={data} />;
};

const ResourcesTableInner: React.FC<{ data: ResourceData[] }> = ({ data }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRowClick = (url: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('resource', encodeURIComponent(url));
    router.push(`?${params.toString()}`);
  };
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Resources</h2>
        <p className="text-sm text-muted-foreground">
          All API endpoints for this domain
        </p>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">URL</TableHead>
              <TableHead className="text-right w-[20%]">Requests</TableHead>
              <TableHead className="text-right w-[20%]">Errors</TableHead>
              <TableHead className="text-right w-[20%]">Avg Duration</TableHead>
              <TableHead className="text-right w-[20%]">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              data.map((resource, index) => {
                // Extract just the path from the URL
                let path = resource.url;
                try {
                  const url = new URL(resource.url);
                  path = url.pathname + url.search + url.hash;
                } catch {
                  // If URL parsing fails, just use the original
                  path = resource.url;
                }

                return (
                  <TableRow
                    key={index}
                    onClick={() => handleRowClick(resource.url)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs break-all">
                      {path}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseInt(resource.total_requests).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseInt(resource.error_count) > 0 ? (
                        <span>
                          {parseInt(resource.error_count).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(parseFloat(resource.avg_duration) / 1000).toFixed(2)}s
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(resource.last_seen), {
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
