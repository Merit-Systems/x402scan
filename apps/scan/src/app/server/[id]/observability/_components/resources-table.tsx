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

interface ResourceData {
  url: string;
  total_requests: string;
  error_count: string;
  avg_duration: string;
  last_seen: string;
}

interface Props {
  data: ResourceData[];
}

export const ResourcesTable: React.FC<Props> = ({ data }) => {
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
              <TableHead className="w-[30%]">URL</TableHead>
              <TableHead className="text-right w-[10%]">Requests</TableHead>
              <TableHead className="text-right w-[10%]">Errors</TableHead>
              <TableHead className="text-right w-[10%]">Avg Duration</TableHead>
              <TableHead className="text-right w-[10%]">Last Updated</TableHead>
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
              data.map((resource, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs break-all">
                    {resource.url}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
