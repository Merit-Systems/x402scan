'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  resources: RouterOutputs['origins']['list']['withResources']['byAddress'][0]['resources'];
  onResourceSelect: (resource: Props['resources'][0]) => void;
  className?: string;
}

export const ResourcesTable: React.FC<Props> = ({
  resources,
  onResourceSelect,
  className,
}) => {
  if (resources.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-muted-foreground">No resources available for this origin.</p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Max Amount</TableHead>
              <TableHead>MIME Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const accept = resource.accepts[0]; // Get first accept for display
              return (
                <TableRow
                  key={resource.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onResourceSelect(resource)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium line-clamp-1">
                        {resource.resource}
                      </div>
                      {accept?.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {accept.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {accept && (
                      <Badge variant="secondary" className="text-xs">
                        {accept.network.replace('_', ' ')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {accept && (
                      <span className="text-sm">
                        {(Number(accept.maxAmountRequired) / 1e18).toFixed(6)} {accept.asset}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {accept && (
                      <Badge variant="outline" className="text-xs">
                        {accept.mimeType}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResourceSelect(resource);
                        }}
                      >
                        <Eye className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(resource.resource, '_blank');
                        }}
                      >
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
