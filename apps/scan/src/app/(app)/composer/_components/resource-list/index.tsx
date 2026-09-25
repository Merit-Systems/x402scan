import React, { useState } from "react";

import { Loader2, SearchX } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

import { Chain } from "@/app/(app)/_components/chains";

import { Filters } from "./filters";

import { SelectedResourceItem } from "./item/selected";
import { UnselectedResourceItem } from "./item/unselected";

import { api } from "@/trpc/client";

import {
  CHAIN_LABELS,
  SUPPORTED_CHAINS,
  type SupportedChain,
} from "@/types/chain";

import type { SelectedResource } from "../../_types/chat-config";

interface Props {
  selectedResourceIds: string[];
  onSelectResource: (resource: SelectedResource) => void;
}

const toolItemHeight = 48;
const numToolsToShow = 5;

export const ResourceList: React.FC<Props> = ({
  selectedResourceIds,
  onSelectResource,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<SupportedChain[]>([]);

  const { data: tools, isLoading } = api.public.tools.search.useQuery({
    search: searchQuery.trim().length > 0 ? searchQuery.trim() : undefined,
    limit: 100,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    chains: selectedChains.length > 0 ? selectedChains : undefined,
  });
  const { data: tags, isLoading: isLoadingTags } =
    api.public.resources.tags.list.useQuery();

  return (
    <Command className="" shouldFilter={false}>
      <CommandInput
        placeholder="Search tools..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <Filters
        title="Categories"
        items={tags ?? []}
        isLoading={isLoadingTags}
        onClickItem={(tag) => {
          setSelectedTags((tags) =>
            tags.includes(tag.id)
              ? tags.filter((t) => t !== tag.id)
              : [...tags, tag.id]
          );
        }}
        isSelected={(tag) => selectedTags.includes(tag.id)}
        itemKey={(tag) => tag.id}
        renderItem={(tag) => tag.name}
      />
      <Filters
        title="Network"
        items={[...SUPPORTED_CHAINS]}
        isLoading={false}
        onClickItem={(chain) => {
          setSelectedChains((chains) =>
            chains.includes(chain)
              ? chains.filter((c) => c !== chain)
              : [...chains, chain]
          );
        }}
        isSelected={(chain) => selectedChains.includes(chain)}
        itemKey={(chain) => chain}
        renderItem={(chain) => (
          <>
            <Chain chain={chain} iconClassName="size-3" />
            <span>{CHAIN_LABELS[chain]}</span>
          </>
        )}
      />
      <CommandList
        style={{
          height: `${String(toolItemHeight * (numToolsToShow + 0.5))}px`,
        }}
      >
        <CommandEmpty
          className="flex flex-col items-center justify-center gap-4 text-center"
          style={{
            height: `${String(toolItemHeight * numToolsToShow)}px`,
          }}
        >
          {isLoading ? (
            <Loader2 className="size-10 animate-spin" />
          ) : (
            <SearchX className="size-10" />
          )}
          <h2>{isLoading ? "Loading..." : "No tools match your search"}</h2>
        </CommandEmpty>
        {selectedResourceIds.length > 0 && (
          <CommandGroup className="" heading="Selected">
            {selectedResourceIds.map((id) => (
              <SelectedResourceItem
                key={id}
                id={id}
                onSelectResource={onSelectResource}
              />
            ))}
          </CommandGroup>
        )}
        {tools && tools.length > 0 && (
          <CommandGroup className="" heading="Tools">
            {tools
              .filter((tool) => !selectedResourceIds.includes(tool.id))
              .map((tool) => {
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
