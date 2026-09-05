"use client";

import { useEffect, useState } from "react";
import { Check, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Tag } from "@x402scan/scan-db";

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
      onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tagId));
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
          <Button variant="outline" size="sm" className="">
            <Filter className="mr-2 size-4" />
            Filter by Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-5">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px]" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading tags..." : "No tags found."}
              </CommandEmpty>
              <CommandGroup>
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const { _count: counts } = tag;
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        handleToggleTag(tag.id);
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex items-center justify-center rounded-sm border border-primary size-4",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="size-3" />
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="size-3 rounded-full border"
                          style={{
                            backgroundColor: tag.color,
                            borderColor: tag.color,
                          }}
                        />
                        <span className="type-supporting-body">{tag.name}</span>
                      </div>
                      <span className="type-caption text-muted-foreground">
                        {counts.resourcesTags}
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
          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((tag: Tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <Button
                  type="button"
                  variant="quiet"
                  size="icon-xs"
                  onClick={() => {
                    handleToggleTag(tag.id);
                  }}
                  className="ml-1"
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className=" "
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  );
};
