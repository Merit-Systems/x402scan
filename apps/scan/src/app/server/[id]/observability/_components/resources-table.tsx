'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead className="text-right">Avg Duration</TableHead>
              <TableHead className="text-right">Last Seen</TableHead>
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
                  <TableCell className="font-mono text-xs max-w-md truncate">
                    {resource.url}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseInt(resource.total_requests).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseInt(resource.error_count) > 0 ? (
                      <span className="text-red-500">
                        {parseInt(resource.error_count).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(parseFloat(resource.avg_duration))}ms
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(resource.last_seen).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
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
