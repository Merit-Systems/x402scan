"use client";

import { useState, useEffect } from "react";

import { Loader2, SearchX, Search } from "lucide-react";

import { useRouter } from "next/navigation";

import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { SearchContext } from "./context";
import { Origin } from "./_components/origins";
import { Resource } from "./_components/resource";

import { api } from "@/trpc/client";

import type { Route } from "next";

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((isOpen) => !isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const input = {
    search,
    limit: 3,
  };

  const options = {
    enabled: isOpen && search.length > 0,
  };

  const { data: origins, isLoading: isLoadingOrigins } =
    api.public.origins.search.useQuery(input, options);
  const { data: resources, isLoading: isLoadingResources } =
    api.public.resources.search.useQuery(input, options);

  const handleSelect = <T extends string>(route: Route<T>) => {
    router.push(route);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <SearchContext.Provider value={{ search, setSearch, isOpen, setIsOpen }}>
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        className="top-[20%] translate-y-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for an origin or resource..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              {isLoadingOrigins || isLoadingResources ? (
                <>
                  <Loader2 className="size-10 animate-spin" />
                  <p>Loading...</p>
                </>
              ) : search.length > 0 ? (
                <>
                  <SearchX className="size-10" />
                  <p>No results found.</p>
                </>
              ) : (
                <>
                  <Search className="size-10" />
                  <p>Search by origin or resource.</p>
                </>
              )}
            </CommandEmpty>
            {(origins?.length ?? 0) > 0 && (
              <CommandGroup heading="Origins">
                {origins?.map((origin) => (
                  <CommandItem
                    key={origin.id}
                    value={origin.origin}
                    onSelect={() => handleSelect(`/server/${origin.id}`)}
                  >
                    <Origin
                      origin={origin}
                      addresses={Array.from(
                        new Set(
                          origin.resources.flatMap((resource) =>
                            resource.accepts.map((accept) => accept.payTo)
                          )
                        )
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {(resources?.length ?? 0) > 0 && (
              <CommandGroup heading="Resources">
                {resources?.map((resource) => (
                  <CommandItem
                    key={resource.id}
                    value={resource.resource}
                    onSelect={() =>
                      handleSelect(`/server/${resource.origin.id}`)
                    }
                  >
                    <Resource resource={resource} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
      {children}
    </SearchContext.Provider>
  );
};
