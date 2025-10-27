'use client';

import Link from 'next/link';

import { Plus, ServerOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { ResourceExecutor } from './executor';

import { getBazaarMethod } from './executor/utils';

import { api } from '@/trpc/client';

import {
  LoadingOriginCard,
  OriginCard,
} from '@/app/_components/resources/origin';

import { useChain } from '@/app/_contexts/chain/hook';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';

interface Props {
  emptyText: string;
  defaultOpenOrigins?: string[];
  address?: string;
}

export const ResourcesByOrigin: React.FC<Props> = ({
  emptyText,
  defaultOpenOrigins = [],
  address,
}) => {
  const { chain } = useChain();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [originsWithResources] =
    api.public.origins.list.withResources.useSuspenseQuery({ chain, address });

  const { data: searchResults, isLoading: isSearching } =
    api.resources.search.useQuery(
      { search: debouncedSearch, limit: 50 },
      { enabled: debouncedSearch.length > 0 }
    );
  const [openOrigins, setOpenOrigins] = useState<string[]>(defaultOpenOrigins);
  const [openSearchOrigins, setOpenSearchOrigins] = useState<string[]>([]);

  if (!debouncedSearch && originsWithResources.length === 0) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ServerOff />
            </EmptyMedia>
            <EmptyTitle>No Resources</EmptyTitle>
            <EmptyDescription>{emptyText}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/resources/register">
              <Button variant="turbo">
                <Plus className="size-4" />
                Register Resource
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </Card>
    );
  }


  if (debouncedSearch && Array.isArray(searchResults)) {

    const fullResourceMap = new Map<string, typeof originsWithResources[number]['resources'][0]>();
    for (const o of originsWithResources) {
      for (const r of o.resources) {
        fullResourceMap.set(r.resource, r as any);
      }
    }

    const grouped = searchResults.reduce<Record<string, typeof searchResults[number][]>>((acc, r) => {
      const key = r.origin?.origin ?? 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {} as Record<string, typeof searchResults[number][]>
    );

    

    return (
      <div className="space-y-4">
        <Input
          placeholder="Search resources by URL, origin, or address"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {isSearching ? (
          <LoadingOriginCard />
        ) : searchResults.length === 0 ? (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No Results</EmptyTitle>
                <EmptyDescription>
                  No resources matched your search.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            value={openSearchOrigins}
            onValueChange={setOpenSearchOrigins}
          >
            {Object.entries(grouped).map(([originStr, resources]) => (
              <AccordionItem value={originStr} key={originStr} className="border-b-0">
                <AccordionTrigger asChild>
                  {/* Prefer origin info from a full resource if available */}
                  <OriginCard origin={(fullResourceMap.get(resources[0].resource)?.origin as any) ?? resources[0].origin} numResources={resources.length} />
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="pl-4">
                    <Accordion type="multiple" className="border-b-0">
                      {resources.map(resource => {
                        const full = fullResourceMap.get(resource.resource) as any | undefined;
                        const renderResource = full ?? resource;
                        const renderResponse = full ? (full.data as any) ?? null : (resource.data as any) ?? null;

                        return (
                          <AccordionItem
                            value={renderResource.id}
                            key={renderResource.id}
                            className="border-b-0 pl-4 border-l pt-4 relative"
                          >
                            <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-[1px] bg-border" />
                            <ResourceExecutor
                              resource={renderResource}
                              bazaarMethod={getBazaarMethod(
                                renderResource.accepts?.[0]?.outputSchema
                              )}
                              className="bg-transparent"
                              response={renderResponse}
                            />
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search resources by URL, origin, or address"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Accordion
        type="multiple"
        value={openOrigins}
        onValueChange={setOpenOrigins}
      >
        {originsWithResources.map((origin, index) => (
          <AccordionItem value={origin.id} key={origin.id} className="border-b-0">
            <AccordionTrigger asChild>
              <OriginCard
                origin={origin}
                numResources={origin.resources.length}
              />
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="pl-4">
                <Accordion type="multiple" className="border-b-0">
                  {origin.resources.map(resource => (
                    <AccordionItem
                      value={resource.id}
                      key={resource.id}
                      className="border-b-0 pl-4 border-l pt-4 relative"
                    >
                      <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-[1px] bg-border" />
                      <ResourceExecutor
                        resource={resource}
                        bazaarMethod={getBazaarMethod(
                          resource.accepts[0].outputSchema
                        )}
                        className="bg-transparent"
                        response={resource.data}
                      />
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </AccordionContent>
            <div className="pl-4">
              <div className="h-4 w-[1px] bg-border" />
              {index === originsWithResources.length - 1 && (
                <div className="size-3 bg-border rounded-full -ml-[5px]" />
              )}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

interface LoadingResourcesByOriginProps {
  loadingRowCount?: number;
}

export const LoadingResourcesByOrigin: React.FC<
  LoadingResourcesByOriginProps
> = ({ loadingRowCount = 2 }) => {
  return (
    <div>
      {Array.from({ length: loadingRowCount }).map((_, index) => (
        <div key={index}>
          <LoadingOriginCard />
          <div className="pl-4">
            <div className="h-4 w-[1px] bg-border" />
            {index === loadingRowCount - 1 && (
              <div className="size-3 bg-border rounded-full -ml-[5px]" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
