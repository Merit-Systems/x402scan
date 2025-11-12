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
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useObservabilityData } from './use-observability-data';
import type { Route } from 'next';

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

const RESOURCES_ENDPOINT = '/api/observability/resources';

function encodeResourceId(url: string): string {
  // Encode URL as URL-safe base64
  const base64 = Buffer.from(url, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export const ResourcesTable: React.FC<Props> = ({ originUrl }) => {
  const { data, isLoading } = useObservabilityData<ResourceData>({
    endpoint: RESOURCES_ENDPOINT,
    originUrl,
  });

  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const handleRowClick = (url: string) => {
    const resourceId = encodeResourceId(url);
    router.push(
      `/server/${serverId}/observability/resource/${resourceId}` as Route
    );
  };

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
                let path = resource.url;
                try {
                  const url = new URL(resource.url);
                  path = url.pathname + url.search + url.hash;
                } catch {
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
