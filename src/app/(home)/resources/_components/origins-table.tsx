'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Favicon } from '@/components/favicon';
import { cn } from '@/lib/utils';
import { safeGetHostname } from '@/lib/url';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origins: RouterOutputs['origins']['list']['withResources']['all'];
  className?: string;
}

export const OriginsTable: React.FC<Props> = ({ origins, className }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrigins = useMemo(() => {
    if (!searchTerm.trim()) return origins;

    const lowerSearch = searchTerm.toLowerCase();
    return origins.filter(origin => {
      const hostname = safeGetHostname(origin.origin);
      const matchesHostname = hostname.toLowerCase().includes(lowerSearch);
      const matchesTitle = origin.title?.toLowerCase().includes(lowerSearch);
      const matchesDescription = origin.description
        ?.toLowerCase()
        .includes(lowerSearch);
      return (
        matchesHostname ||
        (matchesTitle ?? false) ||
        (matchesDescription ?? false)
      );
    });
  }, [origins, searchTerm]);

  if (origins.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-muted-foreground">No origins available.</p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 border-b flex items-center justify-between bg-muted">
        <h3 className="text-lg font-semibold">All Origins</h3>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search origins..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableBody>
            {filteredOrigins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No origins found matching &quot;{searchTerm}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filteredOrigins.map(origin => {
                const hostname = safeGetHostname(origin.origin);
                const recipientAddress = origin.resources[0]?.accepts[0]?.payTo;

                return (
                  <TableRow
                    key={origin.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="py-4 w-12">
                      <Favicon url={origin.favicon} className="size-8" />
                    </TableCell>
                    <TableCell className="py-4 w-[60%]">
                      <Link
                        href={
                          recipientAddress
                            ? `/recipient/${recipientAddress}/resources`
                            : '#'
                        }
                        className="hover:text-primary transition-colors block"
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="font-medium line-clamp-1">
                            {origin.title ?? hostname}
                          </div>
                          {origin.description && (
                            <div className="text-sm text-muted-foreground text-wrap">
                              {origin.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 w-[20%]">
                      <div className="text-sm font-mono text-muted-foreground">
                        {hostname}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 w-[130px] text-right">
                      <Badge variant="secondary" className="text-xs">
                        {origin.resources.length} resource
                        {origin.resources.length !== 1 ? 's' : ''}
                      </Badge>
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
