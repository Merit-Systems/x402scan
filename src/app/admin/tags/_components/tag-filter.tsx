'use client';

import { useEffect, useState } from 'react';
import { Check, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { api } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { type Tag } from '@prisma/client';

interface TagFilterProps {
  selectedTagIds: string[];
  onSelectedTagIdsChange: (tagIds: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  selectedTagIds,
  onSelectedTagIdsChange,
}) => {
  const [open, setOpen] = useState(false);
  const {
    data: tags,
    isLoading,
    refetch,
  } = api.public.resources.tags.list.useQuery();

  const selectedTags =
    tags?.filter((tag: Tag) => selectedTagIds.includes(tag.id)) ?? [];

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelectedTagIdsChange([...selectedTagIds, tagId]);
    }
  };

  const handleClearAll = () => {
    onSelectedTagIdsChange([]);
  };

  useEffect(() => {
    void refetch();
  }, [selectedTagIds, refetch]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Filter by Tags
            {selectedTags.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-5 rounded-full px-1"
              >
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading tags...' : 'No tags found.'}
              </CommandEmpty>
              <CommandGroup>
                {tags?.map((tag: Tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleToggleTag(tag.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: tag.color,
                            borderColor: tag.color,
                          }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tags?.find(t => t.id === tag.id)?._count.resourcesTags}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <>
          <div className="flex items-center gap-1 flex-wrap">
            {selectedTags.map((tag: Tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="h-7 gap-1 pr-1"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <button
                  onClick={() => handleToggleTag(tag.id)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 px-2 text-xs"
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  );
};
