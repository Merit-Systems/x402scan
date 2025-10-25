import React, { useState } from 'react';

import { Loader2, SearchX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

import { api } from '@/trpc/client';

import type { SelectedResource } from '../../_types/chat-config';
import { SelectedResourceItem } from './item/selected';
import { UnselectedResourceItem } from './item/unselected';

interface Props {
  selectedResourceIds: string[];
  onSelectResource: (resource: SelectedResource) => void;
  gradientClassName?: string;
}

const toolItemHeight = 48;
const numToolsToShow = 5;

export const ResourceList: React.FC<Props> = ({
  selectedResourceIds,
  onSelectResource,
  gradientClassName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: tools, isLoading } = api.public.tools.search.useQuery({
    search: searchQuery.trim().length > 0 ? searchQuery.trim() : undefined,
    limit: 100,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
  });
  const { data: tags, isLoading: isLoadingTags } =
    api.public.resources.tags.list.useQuery();

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
          tools.filter(tool => selectedResourceIds.includes(tool.id)).length >
            0 && (
            <CommandGroup className="p-0" heading="Selected">
              {selectedResourceIds.map(id => (
                <SelectedResourceItem
                  key={id}
                  id={id}
                  onSelectResource={onSelectResource}
                />
              ))}
            </CommandGroup>
          )}
        {tools && tools.length > 0 && (
          <CommandGroup className="p-0" heading="Tools">
            {tools
              .filter(tool => !selectedResourceIds.includes(tool.id))
              .map(tool => {
                return (
                  <UnselectedResourceItem
                    key={tool.id}
                    resource={tool}
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
