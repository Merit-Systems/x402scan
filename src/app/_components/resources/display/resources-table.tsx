'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Eye, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = useMemo(() => {
    if (!searchTerm.trim()) return resources;

    const lowerSearch = searchTerm.toLowerCase();
    return resources.filter(resource => {
      const accept = resource.accepts[0];
      const matchesUrl = resource.resource.toLowerCase().includes(lowerSearch);
      const matchesDescription = accept?.description
        ?.toLowerCase()
        .includes(lowerSearch);
      return matchesUrl || matchesDescription;
    });
  }, [resources, searchTerm]);

  if (resources.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-muted-foreground">
          No resources available for this origin.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 border-b flex items-center justify-between bg-muted">
        <h3 className="text-lg font-semibold">Resources</h3>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-8 text-muted-foreground"
                >
                  No resources found matching &quot;{searchTerm}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map(resource => {
                const accept = resource.accepts[0]; // Get first accept for display
                return (
                  <TableRow
                    key={resource.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onResourceSelect(resource)}
                  >
                    <TableCell className="min-w-[250px]">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium line-clamp-1">
                          {resource.resource}
                        </div>
                        {accept?.description && (
                          <div className="text-xs text-muted-foreground text-wrap">
                            {accept.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={e => {
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
                          onClick={e => {
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
