import React, { useState } from 'react';

import { Loader2, SearchX } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';

import { ResourceItem } from './item';

import { api } from '@/trpc/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SelectedResource } from '@/app/(home)/chat/_lib/types';

interface Props {
  selectedResources: SelectedResource[];
  onSelectResource: (resource: SelectedResource) => void;
  gradientClassName?: string;
}

const toolItemHeight = 48;
const numToolsToShow = 5;

export const ToolList: React.FC<Props> = ({
  selectedResources,
  onSelectResource,
  gradientClassName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: tools, isLoading } = api.availableTools.search.useQuery({
    search: searchQuery.trim().length > 0 ? searchQuery.trim() : undefined,
    limit: 100,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
  });
  const { data: tags, isLoading: isLoadingTags } =
    api.resourceTags.list.useQuery();

  return (
    <Command className="bg-transparent" shouldFilter={false}>
      <CommandInput
        placeholder="Search tools..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <div className="my-2">
        <div className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
          Categories
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
          {isLoadingTags
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="w-12 h-[22px]" />
              ))
            : tags?.map(tag => (
                <Badge
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.id) ? 'default' : 'outline'
                  }
                  className="shrink-0 cursor-pointer gap-1 px-1.5 py-0.5"
                  onClick={() =>
                    setSelectedTags(prev =>
                      prev.includes(tag.id)
                        ? prev.filter(t => t !== tag.id)
                        : [...prev, tag.id]
                    )
                  }
                >
                  {tag.name}
                </Badge>
              ))}
        </div>
      </div>
      <CommandList
        style={{
          height: `${toolItemHeight * (numToolsToShow + 0.5)}px`,
        }}
        gradientClassName={gradientClassName}
      >
        <CommandEmpty
          className="flex flex-col items-center justify-center gap-4 p-8 text-center text-sm text-muted-foreground"
          style={{
            height: `${toolItemHeight * numToolsToShow}px`,
          }}
        >
          {isLoading ? (
            <Loader2 className="size-10 animate-spin" />
          ) : (
            <SearchX className="size-10" />
          )}
          <h2>{isLoading ? 'Loading...' : 'No tools match your search'}</h2>
        </CommandEmpty>
        {tools &&
          tools.filter(tool => selectedResources.some(r => r.id === tool.id))
            .length > 0 && (
            <CommandGroup className="p-0" heading="Selected">
              {tools
                ?.filter(tool => selectedResources.some(r => r.id === tool.id))
                .map(tool => (
                  <ResourceItem
                    key={tool.id}
                    resource={tool}
                    isSelected={true}
                    onSelectResource={onSelectResource}
                  />
                ))}
            </CommandGroup>
          )}
        {tools && tools.length > 0 && (
          <CommandGroup className="p-0" heading="Tools">
            {tools
              .filter(tool => !selectedResources.some(r => r.id === tool.id))
              .map(tool => {
                return (
                  <ResourceItem
                    key={tool.id}
                    resource={tool}
                    isSelected={selectedResources.some(r => r.id === tool.id)}
                    onSelectResource={onSelectResource}
                  />
                );
              })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
};
